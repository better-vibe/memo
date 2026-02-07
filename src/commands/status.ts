import { MemoryGraph } from '../core/graph';
import { readAuditLog } from '../core/audit';
import { ENTITY_TYPES } from '../core/entity';

export interface StatusOptions {
  project: string;
  audit: boolean;
  detailed: boolean;
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
  let expiredFacts = 0;
  const today = new Date().toISOString().split('T')[0];

  // Detailed stats
  const entityTypeCount: Record<string, number> = {};
  const categoryBreakdown: Record<string, number> = {};
  const linkCount: Record<string, number> = {};
  let totalLinks = 0;
  let entitiesWithLinks = 0;

  for (const t of ENTITY_TYPES) {
    entityTypeCount[t] = 0;
  }

  for (const { type, slug } of entities) {
    entityTypeCount[type] = (entityTypeCount[type] || 0) + 1;
    const facts = graph.readFacts(type, slug);
    totalFacts += facts.length;

    let entityHasLinks = false;
    for (const f of facts) {
      if (f.status === 'active') {
        activeFacts++;
        categoryBreakdown[f.category] = (categoryBreakdown[f.category] || 0) + 1;

        // Check for expired
        if (f.expiresAt && f.expiresAt < today) {
          expiredFacts++;
        }
      }

      if (f.links && f.links.length > 0) {
        entityHasLinks = true;
        totalLinks += f.links.length;
        for (const link of f.links) {
          linkCount[link.relation] = (linkCount[link.relation] || 0) + 1;
        }
      }
    }
    if (entityHasLinks) entitiesWithLinks++;
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
      expiredFacts,
      entityTypeCount,
      categoryBreakdown,
      linkStats: { totalLinks, entitiesWithLinks, relationBreakdown: linkCount },
    };
    if (options.audit) {
      output.auditLog = auditLog;
    }
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log('Memory Graph Status');
    console.log(`  Entities:         ${entities.length}`);
    console.log(`  Total facts:      ${totalFacts}`);
    console.log(`  Active facts:     ${activeFacts}`);
    console.log(`  Superseded facts: ${totalFacts - activeFacts}`);
    if (expiredFacts > 0) {
      console.log(`  Expired facts:    ${expiredFacts} (active but past expiresAt)`);
    }

    if (options.detailed) {
      // Entity type breakdown
      console.log('\nEntity types:');
      for (const [type, count] of Object.entries(entityTypeCount)) {
        if (count > 0) console.log(`  ${type}: ${count}`);
      }

      // Category breakdown
      const sortedCats = Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a);
      if (sortedCats.length > 0) {
        console.log('\nFact categories (active):');
        for (const [cat, count] of sortedCats) {
          console.log(`  ${cat}: ${count}`);
        }
      }

      // Link stats
      if (totalLinks > 0) {
        console.log('\nRelationships:');
        console.log(`  Total links: ${totalLinks}`);
        console.log(`  Entities with links: ${entitiesWithLinks}/${entities.length}`);
        const sortedRels = Object.entries(linkCount).sort(([, a], [, b]) => b - a);
        for (const [rel, count] of sortedRels) {
          console.log(`  ${rel}: ${count}`);
        }
      }
    }

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
