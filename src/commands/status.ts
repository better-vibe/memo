import { MemoryGraph } from '../core/graph';
import { readAuditLog } from '../core/audit';

export interface StatusOptions {
  project: string;
  audit: boolean;
  json: boolean;
}

export async function statusCommand(options: StatusOptions): Promise<number> {
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
  let totalFacts = 0;
  let activeFacts = 0;

  for (const { type, slug } of entities) {
    const facts = graph.readFacts(type, slug);
    totalFacts += facts.length;
    activeFacts += facts.filter(f => f.status === 'active').length;
  }

  const auditLog = readAuditLog(graph.metaRoot);

  if (options.json) {
    const output: any = {
      status: 'ok',
      initialized: true,
      entityCount: entities.length,
      totalFacts,
      activeFacts,
      supersededFacts: totalFacts - activeFacts,
    };
    if (options.audit) {
      output.auditLog = auditLog;
    }
    console.log(JSON.stringify(output));
  } else {
    console.log('Memory Graph Status');
    console.log(`  Entities:         ${entities.length}`);
    console.log(`  Total facts:      ${totalFacts}`);
    console.log(`  Active facts:     ${activeFacts}`);
    console.log(`  Superseded facts: ${totalFacts - activeFacts}`);

    if (options.audit && auditLog.length > 0) {
      console.log('\nAudit Log (recent):');
      const recent = auditLog.slice(-10);
      for (const entry of recent) {
        console.log(`  ${entry.timestamp} ${entry.operation} [${entry.source}] → ${entry.entitiesAffected.join(', ')} (+${entry.factsAdded})`);
      }
    }
  }

  return 0;
}
