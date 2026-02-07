import * as fs from 'fs';
import { MemoryGraph } from '../core/graph';
import { EntityType, ENTITY_TYPES, displayNameFromSlug } from '../core/entity';
import { FactItem, FactCategory } from '../core/validation';
import { getActiveFacts } from '../core/facts';

export interface ContextOptions {
  project: string;
  json: boolean;
  entityType?: string;
  entity?: string;
  maxFacts?: string;
  compact: boolean;
  includeDecisions: boolean;
  includeAgents: boolean;
}

interface EntityContext {
  type: EntityType;
  slug: string;
  displayName: string;
  factCount: number;
  facts: FactItem[];
  links: Array<{ target: string; relation: string }>;
}

interface ContextOutput {
  generatedAt: string;
  graphStats: {
    entityCount: number;
    activeFactCount: number;
    categoryBreakdown: Record<string, number>;
  };
  entities: EntityContext[];
  decisions?: string;
  agents?: string;
}

/**
 * Generate an AI-optimized context dump for session startup.
 *
 * This command produces a compact, structured overview of the knowledge graph
 * so an AI agent can quickly bootstrap its understanding of a project without
 * issuing multiple separate queries.
 */
export async function contextCommand(options: ContextOptions): Promise<number> {
  const graph = new MemoryGraph(options.project);

  if (!graph.isInitialized()) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Memory graph not initialized. Run memo init first.' }));
    } else {
      console.error('Memory graph not initialized. Run `memo init` first.');
    }
    return 1;
  }

  const maxFacts = options.maxFacts ? parseInt(options.maxFacts, 10) : undefined;
  const today = new Date().toISOString().split('T')[0];

  // Determine which entities to include
  let entities: Array<{ type: EntityType; slug: string }>;
  if (options.entity) {
    const parts = options.entity.split('/');
    if (parts.length !== 2) {
      const msg = 'Entity must be in format type/slug (e.g., projects/api-backend)';
      if (options.json) {
        console.log(JSON.stringify({ status: 'error', message: msg }));
      } else {
        console.error(msg);
      }
      return 1;
    }
    entities = [{ type: parts[0] as EntityType, slug: parts[1] }];
  } else if (options.entityType) {
    entities = graph.listEntities(options.entityType as EntityType);
  } else {
    entities = graph.listEntities();
  }

  // Build context for each entity
  const entityContexts: EntityContext[] = [];
  const globalCategoryBreakdown: Record<string, number> = {};
  let totalActiveFacts = 0;

  for (const { type, slug } of entities) {
    const allFacts = graph.readFacts(type, slug);
    let active = getActiveFacts(allFacts);

    // Filter out expired facts
    active = active.filter(f => {
      if (f.expiresAt && f.expiresAt < today) return false;
      return true;
    });

    // Count categories
    for (const f of active) {
      globalCategoryBreakdown[f.category] = (globalCategoryBreakdown[f.category] || 0) + 1;
    }
    totalActiveFacts += active.length;

    // Rank facts: higher confidence first, then more recent first
    active.sort((a, b) => {
      const confDiff = (b.confidence ?? 0.5) - (a.confidence ?? 0.5);
      if (confDiff !== 0) return confDiff;
      return b.timestamp.localeCompare(a.timestamp);
    });

    // Apply max-facts limit per entity
    if (maxFacts && active.length > maxFacts) {
      active = active.slice(0, maxFacts);
    }

    // Collect links
    const links: Array<{ target: string; relation: string }> = [];
    for (const f of active) {
      if (f.links) {
        for (const link of f.links) {
          links.push({
            target: `${link.entityType}/${link.slug}`,
            relation: link.relation,
          });
        }
      }
    }

    // Deduplicate links
    const seenLinks = new Set<string>();
    const uniqueLinks = links.filter(l => {
      const key = `${l.target}:${l.relation}`;
      if (seenLinks.has(key)) return false;
      seenLinks.add(key);
      return true;
    });

    entityContexts.push({
      type,
      slug,
      displayName: displayNameFromSlug(slug),
      factCount: active.length,
      facts: active,
      links: uniqueLinks,
    });
  }

  // Optionally load DECISIONS.md and AGENTS.md
  let decisions: string | undefined;
  let agents: string | undefined;

  if (options.includeDecisions && fs.existsSync(graph.decisionsPath)) {
    decisions = fs.readFileSync(graph.decisionsPath, 'utf-8');
  }
  if (options.includeAgents && fs.existsSync(graph.agentsPath)) {
    agents = fs.readFileSync(graph.agentsPath, 'utf-8');
  }

  const output: ContextOutput = {
    generatedAt: new Date().toISOString(),
    graphStats: {
      entityCount: entities.length,
      activeFactCount: totalActiveFacts,
      categoryBreakdown: globalCategoryBreakdown,
    },
    entities: entityContexts,
    ...(decisions && { decisions }),
    ...(agents && { agents }),
  };

  if (options.json) {
    console.log(JSON.stringify({ status: 'ok', ...output }, null, 2));
  } else {
    printHumanReadable(output, options.compact);
  }

  return 0;
}

function printHumanReadable(ctx: ContextOutput, compact: boolean): void {
  console.log('=== Knowledge Graph Context ===');
  console.log(`Generated: ${ctx.generatedAt}`);
  console.log(`Entities: ${ctx.graphStats.entityCount} | Active facts: ${ctx.graphStats.activeFactCount}`);

  // Category breakdown
  const cats = Object.entries(ctx.graphStats.categoryBreakdown)
    .sort(([, a], [, b]) => b - a);
  if (cats.length > 0) {
    console.log(`Categories: ${cats.map(([k, v]) => `${k}(${v})`).join(', ')}`);
  }

  console.log('');

  for (const entity of ctx.entities) {
    console.log(`--- ${entity.type}/${entity.slug} (${entity.displayName}) ---`);

    if (compact) {
      // Compact: one line per fact
      for (const f of entity.facts) {
        const conf = f.confidence !== undefined ? ` [${Math.round(f.confidence * 100)}%]` : '';
        console.log(`  [${f.category}]${conf} ${f.fact}`);
      }
    } else {
      // Group by category
      const byCategory = new Map<string, FactItem[]>();
      for (const f of entity.facts) {
        const list = byCategory.get(f.category) || [];
        list.push(f);
        byCategory.set(f.category, list);
      }

      for (const [category, items] of byCategory) {
        console.log(`  ${category}:`);
        for (const item of items) {
          const conf = item.confidence !== undefined ? ` [${Math.round(item.confidence * 100)}%]` : '';
          const tags = item.tags && item.tags.length > 0 ? ` #${item.tags.join(' #')}` : '';
          console.log(`    - ${item.fact}${conf}${tags}`);
        }
      }
    }

    if (entity.links.length > 0) {
      console.log(`  links: ${entity.links.map(l => `${l.relation} → ${l.target}`).join(', ')}`);
    }

    console.log('');
  }

  if (ctx.decisions) {
    console.log('=== DECISIONS.md ===');
    console.log(ctx.decisions);
  }

  if (ctx.agents) {
    console.log('=== AGENTS.md ===');
    console.log(ctx.agents);
  }
}
