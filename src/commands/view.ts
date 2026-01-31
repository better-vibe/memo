import { MemoryGraph } from '../core/graph';
import { EntityType, ENTITY_TYPES } from '../core/entity';

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

  const [rawEntityType, slug] = parts as [string, string];
  if (!ENTITY_TYPES.includes(rawEntityType as EntityType)) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: `Invalid entity type: ${rawEntityType}` }));
    } else {
      console.error(`Invalid entity type: ${rawEntityType}`);
    }
    return 1;
  }
  const entityType = rawEntityType as EntityType;

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
  const activeFacts = facts.filter(f => f.status === 'active');
  const supersededFacts = facts.filter(f => f.status === 'superseded');

  if (options.json) {
    // Enhanced JSON output with all fields
    const response: any = {
      status: 'ok',
      entity: {
        type: entityType,
        slug: slug,
        path: options.entity,
      },
      summary,
      facts: {
        total: facts.length,
        active: activeFacts.length,
        superseded: supersededFacts.length,
        items: options.full ? facts : activeFacts,
      },
    };
    console.log(JSON.stringify(response, null, 2));
  } else {
    // Rich human-readable output (new default)
    console.log(summary);
    
    // Facts section with evidence
    console.log('\n## Facts\n');
    
    if (activeFacts.length > 0) {
      console.log(`### Active (${activeFacts.length})\n`);
      for (const f of activeFacts) {
        console.log(`**[${f.id}]** ${f.fact}`);
        console.log(`  Category: ${f.category} | Source: ${f.source} | Date: ${f.timestamp}`);
        if (f.confidence !== undefined) {
          console.log(`  Confidence: ${f.confidence}`);
        }
        if (f.evidence) {
          console.log(`  Evidence: ${f.evidence}`);
        }
        if (f.tags && f.tags.length > 0) {
          console.log(`  Tags: ${f.tags.join(', ')}`);
        }
        console.log('');
      }
    }
    
    if (options.full && supersededFacts.length > 0) {
      console.log(`### Superseded (${supersededFacts.length})\n`);
      for (const f of supersededFacts) {
        console.log(`**[${f.id}]** ~~${f.fact}~~ [superseded]`);
        if (f.supersededBy) {
          console.log(`  → Superseded by: ${f.supersededBy}`);
        }
        console.log('');
      }
    }
    
    // Related entities placeholder (for Phase 3)
    console.log('## Related Entities\n');
    console.log('*(Relationship linking coming in Phase 3)*\n');
  }

  return 0;
}
