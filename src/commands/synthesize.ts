import { MemoryGraph } from '../core/graph';
import { ENTITY_TYPES, displayNameFromSlug } from '../core/entity';
import { appendAudit } from '../core/audit';
import * as fs from 'fs';
import * as path from 'path';

export interface SynthesizeOptions {
  project: string;
  entity?: string;
  all: boolean;
  json: boolean;
  noEdit: boolean;
  dryRun: boolean;
}

function generateSummary(entityType: string, slug: string, facts: import('../core/validation').FactItem[], graphRoot: string): string {
  const active = facts.filter(f => f.status === 'active');
  const today = new Date().toISOString().split('T')[0];
  
  // Try to find original display name from cache
  let displayName = displayNameFromSlug(slug);
  const cachePath = path.join(graphRoot, '..', '_meta', 'entities.json');
  if (fs.existsSync(cachePath)) {
    try {
      const cache: Record<string, string> = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      // Find the original name that maps to this slug
      for (const [originalName, cachedSlug] of Object.entries(cache)) {
        if (cachedSlug === slug) {
          displayName = originalName;
          break;
        }
      }
    } catch { /* ignore */ }
  }

  let summary = `# ${displayName}\n\n`;

  // Group by category
  const byCategory = new Map<string, typeof active>();
  for (const f of active) {
    const list = byCategory.get(f.category) || [];
    list.push(f);
    byCategory.set(f.category, list);
  }

  for (const [category, items] of byCategory) {
    summary += `## ${category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')}\n`;
    for (const item of items) {
      summary += `- ${item.fact}\n`;
    }
    summary += '\n';
  }

  summary += `Last updated: ${today}\n`;
  return summary;
}

export async function synthesizeCommand(options: SynthesizeOptions): Promise<number> {
  const graph = new MemoryGraph(options.project);

  if (!graph.isInitialized()) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Memory graph not initialized.' }));
    } else {
      console.error('Memory graph not initialized. Run `memo init` first.');
    }
    return 1;
  }

  let entities: { type: import('../core/entity').EntityType; slug: string }[];

  if (options.all) {
    entities = graph.listEntities();
  } else if (options.entity) {
    const parts = options.entity.split('/');
    if (parts.length !== 2) {
      if (options.json) {
        console.log(JSON.stringify({ status: 'error', message: 'Entity must be in format type/slug' }));
      } else {
        console.error('Entity must be in format type/slug (e.g., projects/api-backend)');
      }
      return 1;
    }
    const [rawEntityType, slug] = parts as [string, string];
    if (!ENTITY_TYPES.includes(rawEntityType as import('../core/entity').EntityType)) {
      if (options.json) {
        console.log(JSON.stringify({ status: 'error', message: `Invalid entity type: ${rawEntityType}` }));
      } else {
        console.error(`Invalid entity type: ${rawEntityType}`);
      }
      return 1;
    }
    entities = [{ type: rawEntityType as any, slug }];
  } else {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Specify --all or an entity path' }));
    } else {
      console.error('Specify --all or provide an entity path (e.g., projects/api-backend)');
    }
    return 1;
  }

  let summariesRewritten = 0;
  const rewritten: string[] = [];

  for (const { type, slug } of entities) {
    const facts = graph.readFacts(type, slug);
    if (facts.length === 0) continue;

    const summary = generateSummary(type, slug, facts, graph.graphRoot);

    if (options.dryRun) {
      if (!options.json) {
        console.log(`--- ${type}/${slug} ---`);
        console.log(summary);
      }
      summariesRewritten++;
      rewritten.push(`${type}/${slug}`);
      continue;
    }

    graph.writeSummary(type, slug, summary);
    summariesRewritten++;
    rewritten.push(`${type}/${slug}`);
  }

  if (summariesRewritten > 0 && !options.dryRun) {
    appendAudit(graph.metaRoot, {
      operation: 'synthesize',
      source: 'cli',
      entitiesAffected: rewritten,
      factsAdded: 0,
      status: 'ok',
    });
  }

  if (options.json) {
    console.log(JSON.stringify({
      status: 'ok',
      dryRun: options.dryRun || false,
      summariesRewritten,
      entities: rewritten,
    }));
  } else {
    if (options.dryRun) {
      console.log(`Dry run: ${summariesRewritten} summary/summaries would be rewritten.`);
    } else {
      console.log(`✅ ${summariesRewritten} summary/summaries rewritten.`);
    }
  }

  return 0;
}
