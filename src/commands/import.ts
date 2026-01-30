import * as fs from 'fs';
import { MemoryGraph } from '../core/graph';
import { FactItemsArraySchema } from '../core/validation';
import { writeFacts, atomicWriteText } from '../core/facts';
import * as entityMod from '../core/entity';
import { appendAudit } from '../core/audit';

export interface ImportOptions {
  project: string;
  input: string;
  force: boolean;
  json: boolean;
  dryRun: boolean;
}

export async function importCommand(options: ImportOptions): Promise<number> {
  const graph = new MemoryGraph(options.project);

  let raw: string;
  if (options.input === '-') {
    raw = await new Promise<string>((resolve) => {
      let d = '';
      process.stdin.setEncoding('utf-8');
      process.stdin.on('data', c => { d += c; });
      process.stdin.on('end', () => resolve(d));
      if (process.stdin.isTTY) resolve('');
    });
  } else {
    if (!fs.existsSync(options.input)) {
      if (options.json) {
        console.log(JSON.stringify({ status: 'error', message: `File not found: ${options.input}` }));
      } else {
        console.error(`File not found: ${options.input}`);
      }
      return 1;
    }
    raw = fs.readFileSync(options.input, 'utf-8');
  }

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Invalid JSON input.' }));
    } else {
      console.error('Invalid JSON input.');
    }
    return 1;
  }

  if (!graph.isInitialized()) {
    graph.initialize();
  }

  if (options.dryRun) {
    const count = data.entities?.length || 0;
    if (options.json) {
      console.log(JSON.stringify({ status: 'ok', dryRun: true, entityCount: count }));
    } else {
      console.log(`Dry run: would import ${count} entities.`);
    }
    return 0;
  }

  let imported = 0;
  if (Array.isArray(data.entities)) {
    for (const e of data.entities) {
      const dir = entityMod.entityPath(graph.graphRoot, e.type, e.slug);
      fs.mkdirSync(dir, { recursive: true });
      if (e.summary) {
        atomicWriteText(entityMod.summaryPath(graph.graphRoot, e.type, e.slug), e.summary);
      }
      if (e.facts) {
        const validation = FactItemsArraySchema.safeParse(e.facts);
        if (validation.success) {
          writeFacts(entityMod.itemsPath(graph.graphRoot, e.type, e.slug), validation.data);
        }
      }
      imported++;
    }
  }

  if (data.agents && (options.force || !fs.existsSync(graph.agentsPath))) {
    atomicWriteText(graph.agentsPath, data.agents);
  }
  if (data.decisions && (options.force || !fs.existsSync(graph.decisionsPath))) {
    atomicWriteText(graph.decisionsPath, data.decisions);
  }

  appendAudit(graph.metaRoot, {
    operation: 'import',
    source: options.input,
    entitiesAffected: (data.entities || []).map((e: any) => `${e.type}/${e.slug}`),
    factsAdded: 0,
    status: 'ok',
    details: `Imported ${imported} entities`,
  });

  if (options.json) {
    console.log(JSON.stringify({ status: 'ok', entitiesImported: imported }));
  } else {
    console.log(`✅ Imported ${imported} entities.`);
  }

  return 0;
}
