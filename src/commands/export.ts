import * as fs from 'fs';
import * as path from 'path';
import { MemoryGraph } from '../core/graph';
import { readAuditLog } from '../core/audit';

export interface ExportOptions {
  project: string;
  output: string;
  json: boolean;
}

export async function exportCommand(options: ExportOptions): Promise<number> {
  const graph = new MemoryGraph(options.project);

  if (!graph.isInitialized()) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Memory graph not initialized.' }));
    } else {
      console.error('Memory graph not initialized. Run `memo init` first.');
    }
    return 1;
  }

  const entities = graph.listEntities();
  const data: any = {
    version: 1,
    exportedAt: new Date().toISOString(),
    entities: [],
    audit: readAuditLog(graph.metaRoot),
  };

  for (const { type, slug } of entities) {
    data.entities.push({
      type,
      slug,
      summary: graph.readSummary(type, slug),
      facts: graph.readFacts(type, slug),
    });
  }

  // Read AGENTS.md and DECISIONS.md if they exist
  if (fs.existsSync(graph.agentsPath)) {
    data.agents = fs.readFileSync(graph.agentsPath, 'utf-8');
  }
  if (fs.existsSync(graph.decisionsPath)) {
    data.decisions = fs.readFileSync(graph.decisionsPath, 'utf-8');
  }

  const jsonStr = JSON.stringify(data, null, 2);

  if (options.output === '-') {
    console.log(jsonStr);
  } else {
    fs.writeFileSync(options.output, jsonStr, 'utf-8');
    if (options.json) {
      console.log(JSON.stringify({ status: 'ok', output: options.output, entityCount: entities.length }));
    } else {
      console.log(`✅ Exported ${entities.length} entities to ${options.output}`);
    }
  }

  return 0;
}
