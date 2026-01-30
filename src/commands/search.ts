import { MemoryGraph } from '../core/graph';

export interface SearchOptions {
  project: string;
  query: string;
  category?: string;
  entityType?: string;
  json: boolean;
}

export async function searchCommand(options: SearchOptions): Promise<number> {
  const graph = new MemoryGraph(options.project);

  if (!graph.isInitialized()) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Memory graph not initialized.' }));
    } else {
      console.error('Memory graph not initialized. Run `memo init` first.');
    }
    return 1;
  }

  const query = options.query.toLowerCase();
  const entities = graph.listEntities(options.entityType as any);
  const results: { entity: string; fact: import('../core/validation').FactItem }[] = [];

  for (const { type, slug } of entities) {
    const facts = graph.readFacts(type, slug);
    for (const f of facts) {
      if (f.status !== 'active') continue;
      if (options.category && f.category !== options.category) continue;
      if (
        f.fact.toLowerCase().includes(query) ||
        (f.evidence && f.evidence.toLowerCase().includes(query)) ||
        f.id.toLowerCase().includes(query)
      ) {
        results.push({ entity: `${type}/${slug}`, fact: f });
      }
    }
  }

  if (options.json) {
    console.log(JSON.stringify({ status: 'ok', count: results.length, results }));
  } else {
    if (results.length === 0) {
      console.log('No results found.');
    } else {
      console.log(`Found ${results.length} result(s):\n`);
      for (const r of results) {
        console.log(`  ${r.entity} [${r.fact.id}] ${r.fact.fact}`);
      }
    }
  }

  return 0;
}
