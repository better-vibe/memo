import { MemoryGraph } from '../core/graph';
import { EntityType, ENTITY_TYPES } from '../core/entity';
import { FactItem, FactCategory } from '../core/validation';

export interface QueryOptions {
  project: string;
  json: boolean;
  // Filters
  entityType?: string;
  category?: string;
  status?: string;
  source?: string;
  // Text search
  query?: string;
  evidenceContains?: string;
  // Tag filter
  tag?: string;
  // Exclude expired facts
  excludeExpired?: boolean;
  // Related entities
  relatedTo?: string;
  // Compound query (AND logic)
  where?: string[];
}

interface QueryResult {
  entity: string;
  type: EntityType;
  slug: string;
  fact: FactItem;
}

export async function queryCommand(options: QueryOptions): Promise<number> {
  const graph = new MemoryGraph(options.project);

  if (!graph.isInitialized()) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Memory graph not initialized.' }));
    } else {
      console.error('Memory graph not initialized. Run `memo init` first.');
    }
    return 1;
  }

  try {
    let results: QueryResult[] = [];

    // Build filter function from options
    const filterFn = buildFilterFunction(options);

    // If querying related entities, start from that entity
    if (options.relatedTo) {
      results = queryRelated(graph, options.relatedTo, filterFn);
    } else {
      // Query all entities
      const entities = graph.listEntities();
      
      for (const { type, slug } of entities) {
        const facts = graph.readFacts(type, slug);
        
        for (const fact of facts) {
          if (filterFn(fact, type, slug)) {
            results.push({
              entity: `${type}/${slug}`,
              type,
              slug,
              fact,
            });
          }
        }
      }
    }

    // Output results
    if (options.json) {
      console.log(JSON.stringify({
        status: 'ok',
        query: buildQueryDescription(options),
        count: results.length,
        results: results.map(r => ({
          entity: r.entity,
          type: r.type,
          slug: r.slug,
          factId: r.fact.id,
          fact: r.fact.fact,
          category: r.fact.category,
          status: r.fact.status,
          timestamp: r.fact.timestamp,
          source: r.fact.source,
          confidence: r.fact.confidence,
          evidence: r.fact.evidence,
          links: r.fact.links,
        })),
      }, null, 2));
    } else {
      if (results.length === 0) {
        console.log(`No facts found matching: ${buildQueryDescription(options)}`);
      } else {
        console.log(`Found ${results.length} fact(s) matching: ${buildQueryDescription(options)}\n`);
        
        // Group by entity
        const byEntity = new Map<string, QueryResult[]>();
        for (const r of results) {
          const list = byEntity.get(r.entity) || [];
          list.push(r);
          byEntity.set(r.entity, list);
        }
        
        for (const [entity, facts] of byEntity) {
          console.log(`\n${entity}:`);
          for (const r of facts) {
            const status = r.fact.status === 'superseded' ? ' [superseded]' : '';
            console.log(`  [${r.fact.id}]${status} ${r.fact.fact}`);
            if (r.fact.evidence) {
              console.log(`    Evidence: ${r.fact.evidence}`);
            }
          }
        }
      }
    }

    return 0;
  } catch (err: any) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: err.message }));
    } else {
      console.error(`Query error: ${err.message}`);
    }
    return 1;
  }
}

/**
 * Build a filter function from query options
 */
function buildFilterFunction(options: QueryOptions): (fact: FactItem, type: EntityType, slug: string) => boolean {
  const filters: Array<(fact: FactItem, type: EntityType, slug: string) => boolean> = [];

  // Entity type filter
  if (options.entityType) {
    const allowedTypes = options.entityType.split(',').map(t => t.trim());
    filters.push((fact, type) => allowedTypes.includes(type));
  }

  // Category filter
  if (options.category) {
    const allowedCategories = options.category.split(',').map(c => c.trim());
    filters.push((fact) => allowedCategories.includes(fact.category));
  }

  // Status filter
  if (options.status) {
    filters.push((fact) => fact.status === options.status);
  }

  // Source filter
  if (options.source) {
    const sourcePattern = new RegExp(options.source, 'i');
    filters.push((fact) => sourcePattern.test(fact.source));
  }

  // Text query (searches fact text)
  if (options.query) {
    const queryPattern = new RegExp(options.query, 'i');
    filters.push((fact) => queryPattern.test(fact.fact));
  }

  // Evidence search
  if (options.evidenceContains) {
    const evidencePattern = new RegExp(options.evidenceContains, 'i');
    filters.push((fact) => fact.evidence ? evidencePattern.test(fact.evidence) : false);
  }

  // Tag filter
  if (options.tag) {
    const requiredTags = options.tag.split(',').map(t => t.trim().toLowerCase());
    filters.push((fact) => {
      if (!fact.tags || fact.tags.length === 0) return false;
      const factTags = fact.tags.map(t => t.toLowerCase());
      return requiredTags.every(rt => factTags.includes(rt));
    });
  }

  // Exclude expired facts
  if (options.excludeExpired) {
    const today = new Date().toISOString().split('T')[0];
    filters.push((fact) => {
      if (fact.expiresAt && fact.expiresAt < today) return false;
      return true;
    });
  }

  // Compound where clauses
  if (options.where && options.where.length > 0) {
    for (const whereClause of options.where) {
      const [field, operator, value] = parseWhereClause(whereClause);
      filters.push((fact) => evaluateWhereClause(fact, field, operator, value));
    }
  }

  // Return combined filter (AND logic)
  return (fact, type, slug) => filters.every(f => f(fact, type, slug));
}

/**
 * Parse a where clause like "confidence>0.8" or "category=dependency"
 */
function parseWhereClause(clause: string): [string, string, string] {
  // Match patterns like: field=value, field>value, field>=value, field<value, field<=value
  const match = clause.match(/^([^=<>]+)(=|>=|<=|>|<)(.+)$/);
  if (!match) {
    throw new Error(`Invalid where clause: ${clause}. Format: field=value or field>value`);
  }
  return [match[1].trim(), match[2], match[3].trim()];
}

/**
 * Evaluate a where clause against a fact
 */
function evaluateWhereClause(fact: FactItem, field: string, operator: string, value: string): boolean {
  const factValue = (fact as any)[field];
  
  if (factValue === undefined) {
    return false;
  }

  const numValue = parseFloat(value);
  const factNumValue = typeof factValue === 'number' ? factValue : parseFloat(factValue);

  switch (operator) {
    case '=':
      return String(factValue).toLowerCase() === value.toLowerCase();
    case '>':
      return !isNaN(factNumValue) && !isNaN(numValue) && factNumValue > numValue;
    case '>=':
      return !isNaN(factNumValue) && !isNaN(numValue) && factNumValue >= numValue;
    case '<':
      return !isNaN(factNumValue) && !isNaN(numValue) && factNumValue < numValue;
    case '<=':
      return !isNaN(factNumValue) && !isNaN(numValue) && factNumValue <= numValue;
    default:
      return false;
  }
}

/**
 * Query facts related to a specific entity
 */
function queryRelated(graph: MemoryGraph, entityPath: string, filterFn: (fact: FactItem, type: EntityType, slug: string) => boolean): QueryResult[] {
  const results: QueryResult[] = [];
  const [targetType, targetSlug] = entityPath.split('/');
  
  if (!targetType || !targetSlug) {
    throw new Error(`Invalid entity path: ${entityPath}. Format: type/slug`);
  }

  // Read target entity facts to find links
  const targetFacts = graph.readFacts(targetType as EntityType, targetSlug);
  
  // Collect all linked entities
  const linkedEntities = new Set<string>();
  
  for (const fact of targetFacts) {
    if (fact.links) {
      for (const link of fact.links) {
        linkedEntities.add(`${link.entityType}/${link.slug}`);
      }
    }
  }

  // Query all linked entities
  for (const entityKey of linkedEntities) {
    const [type, slug] = entityKey.split('/');
    const facts = graph.readFacts(type as EntityType, slug);
    
    for (const fact of facts) {
      if (filterFn(fact, type as EntityType, slug)) {
        results.push({
          entity: entityKey,
          type: type as EntityType,
          slug,
          fact,
        });
      }
    }
  }

  return results;
}

/**
 * Build human-readable query description
 */
function buildQueryDescription(options: QueryOptions): string {
  const parts: string[] = [];
  
  if (options.entityType) parts.push(`entityType=${options.entityType}`);
  if (options.category) parts.push(`category=${options.category}`);
  if (options.status) parts.push(`status=${options.status}`);
  if (options.source) parts.push(`source=${options.source}`);
  if (options.query) parts.push(`query="${options.query}"`);
  if (options.evidenceContains) parts.push(`evidence="${options.evidenceContains}"`);
  if (options.tag) parts.push(`tag=${options.tag}`);
  if (options.excludeExpired) parts.push(`excludeExpired=true`);
  if (options.relatedTo) parts.push(`relatedTo=${options.relatedTo}`);
  if (options.where) parts.push(...options.where.map(w => `where(${w})`));
  
  return parts.join(' AND ') || 'all facts';
}
