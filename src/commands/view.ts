import { MemoryGraph } from '../core/graph';
import { EntityType } from '../core/entity';

export interface ViewOptions {
  project: string;
  entity: string;
  full: boolean;
  json: boolean;
}

export async function viewCommand(options: ViewOptions): Promise<number> {
  const graph = new MemoryGraph(options.project);

  if (!graph.isInitialized()) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Memory graph not initialized.' }));
    } else {
      console.error('Memory graph not initialized. Run `memo init` first.');
    }
    return 1;
  }

  const parts = options.entity.split('/');
  if (parts.length !== 2) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Entity must be type/slug' }));
    } else {
      console.error('Entity must be in format type/slug (e.g., projects/api-backend)');
    }
    return 1;
  }

  const [entityType, slug] = parts as [EntityType, string];

  if (!graph.entityExists(entityType, slug)) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: `Entity ${options.entity} not found.` }));
    } else {
      console.error(`Entity ${options.entity} not found.`);
    }
    return 1;
  }

  const summary = graph.readSummary(entityType, slug);
  const facts = graph.readFacts(entityType, slug);

  if (options.json) {
    console.log(JSON.stringify({
      status: 'ok',
      entity: options.entity,
      summary,
      facts: options.full ? facts : facts.filter(f => f.status === 'active'),
    }));
  } else {
    console.log(summary);
    if (options.full) {
      console.log('\n--- All Facts ---');
      for (const f of facts) {
        const status = f.status === 'superseded' ? ' [superseded]' : '';
        console.log(`  [${f.id}]${status} ${f.fact}`);
        if (f.supersededBy) console.log(`    → superseded by ${f.supersededBy}`);
      }
    } else {
      const active = facts.filter(f => f.status === 'active');
      if (active.length > 0) {
        console.log('\n--- Active Facts ---');
        for (const f of active) {
          console.log(`  [${f.id}] ${f.fact}`);
        }
      }
    }
  }

  return 0;
}
