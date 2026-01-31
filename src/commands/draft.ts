import * as fs from 'fs';
import * as path from 'path';
import { MemoryGraph } from '../core/graph';
import { atomicWriteJSON } from '../core/facts';
import { slugify, entityExists } from '../core/entity';
import { detectLinksFromFact } from '../core/facts';
import { ExtractionProposal, validateExtractionProposals } from '../core/validation';

export interface DraftOptions {
  project: string;
  add?: string;
  list?: boolean;
  flush?: boolean;
  clear?: boolean;
  json: boolean;
}

interface DraftItem {
  id: string;
  fact: string;
  timestamp: string;
  inferred?: {
    entityType?: string;
    entityName?: string;
    category?: string;
  };
}

interface DraftStore {
  items: DraftItem[];
  lastUpdated: string;
}

/**
 * Get path to draft file
 */
function getDraftPath(projectRoot: string): string {
  return path.join(projectRoot, 'memory', '_meta', 'draft.json');
}

/**
 * Read draft store
 */
function readDrafts(projectRoot: string): DraftStore {
  const draftPath = getDraftPath(projectRoot);
  if (!fs.existsSync(draftPath)) {
    return { items: [], lastUpdated: new Date().toISOString() };
  }
  try {
    const raw = fs.readFileSync(draftPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { items: [], lastUpdated: new Date().toISOString() };
  }
}

/**
 * Write draft store
 */
function writeDrafts(projectRoot: string, drafts: DraftStore): void {
  const draftPath = getDraftPath(projectRoot);
  drafts.lastUpdated = new Date().toISOString();
  atomicWriteJSON(draftPath, drafts);
}

/**
 * Auto-infer entity type and category from fact text
 */
function inferFactMetadata(fact: string): { entityType?: string; entityName?: string; category?: string } {
  const lower = fact.toLowerCase();
  
  // Try to infer entity name from patterns
  let entityName: string | undefined;
  
  // Pattern: "X uses Y" - X is likely a project
  const usesMatch = fact.match(/(\w+)\s+uses?\s+/i);
  if (usesMatch) {
    entityName = usesMatch[1];
  }
  
  // Pattern: "X implements Y" - X is likely a project
  const implementsMatch = fact.match(/(\w+)\s+implements?\s+/i);
  if (implementsMatch) {
    entityName = implementsMatch[1];
  }
  
  // Infer entity type based on keywords
  let entityType: string | undefined;
  if (lower.includes('project') || lower.includes('app') || lower.includes('service')) {
    entityType = 'projects';
  } else if (lower.includes('library') || lower.includes('package') || lower.includes('framework')) {
    entityType = 'libraries';
  } else if (lower.includes('pattern') || lower.includes('architecture')) {
    entityType = 'patterns';
  } else {
    entityType = 'projects'; // Default
  }
  
  // Infer category based on keywords
  let category: string | undefined;
  if (lower.includes('version') || lower.match(/v?\d+\.\d+/)) {
    category = 'version';
  } else if (lower.includes('depend') || lower.includes('uses') || lower.includes('import')) {
    category = 'dependency';
  } else if (lower.includes('constraint') || lower.includes('must') || lower.includes('cannot')) {
    category = 'constraint';
  } else if (lower.includes('architecture') || lower.includes('pattern') || lower.includes('design')) {
    category = 'architecture';
  } else if (lower.includes('decision') || lower.includes('chose') || lower.includes('migrated')) {
    category = 'decision';
  } else if (lower.includes('bug') || lower.includes('issue') || lower.includes('error')) {
    category = 'bug';
  } else if (lower.includes('debt') || lower.includes('refactor') || lower.includes('cleanup')) {
    category = 'tech_debt';
  } else if (lower.includes('rule') || lower.includes('standard') || lower.includes('convention')) {
    category = 'rule';
  } else if (lower.includes('status') || lower.includes('production') || lower.includes('deployed')) {
    category = 'status';
  } else {
    category = 'status'; // Default
  }
  
  return { entityType, entityName, category };
}

export async function draftCommand(options: DraftOptions): Promise<number> {
  const graph = new MemoryGraph(options.project);

  if (!graph.isInitialized()) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Memory graph not initialized. Run memo init first.' }));
    } else {
      console.error('Memory graph not initialized. Run `memo init` first.');
    }
    return 1;
  }

  const drafts = readDrafts(graph.projectRoot);

  // Handle --add
  if (options.add) {
    const draft: DraftItem = {
      id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fact: options.add,
      timestamp: new Date().toISOString(),
      inferred: inferFactMetadata(options.add),
    };
    
    drafts.items.push(draft);
    writeDrafts(graph.projectRoot, drafts);
    
    if (options.json) {
      console.log(JSON.stringify({
        status: 'ok',
        action: 'added',
        draftId: draft.id,
        queueLength: drafts.items.length,
        inferred: draft.inferred,
      }));
    } else {
      console.log(`✅ Added to draft queue (${drafts.items.length} total)`);
      if (draft.inferred) {
        console.log(`   Inferred: ${draft.inferred.entityType}/${draft.inferred.entityName} (${draft.inferred.category})`);
      }
    }
    return 0;
  }

  // Handle --list
  if (options.list) {
    if (options.json) {
      console.log(JSON.stringify({
        status: 'ok',
        count: drafts.items.length,
        items: drafts.items,
      }));
    } else {
      if (drafts.items.length === 0) {
        console.log('Draft queue is empty.');
        console.log('Use `memo draft --add "fact text"` to queue facts.');
      } else {
        console.log(`📋 Draft Queue (${drafts.items.length} items):\n`);
        drafts.items.forEach((item, idx) => {
          console.log(`${idx + 1}. ${item.fact}`);
          if (item.inferred?.entityType) {
            console.log(`   → ${item.inferred.entityType}/${item.inferred.entityName || 'unknown'} (${item.inferred.category})`);
          }
          console.log('');
        });
      }
    }
    return 0;
  }

  // Handle --clear
  if (options.clear) {
    const count = drafts.items.length;
    drafts.items = [];
    writeDrafts(graph.projectRoot, drafts);
    
    if (options.json) {
      console.log(JSON.stringify({
        status: 'ok',
        action: 'cleared',
        clearedCount: count,
      }));
    } else {
      console.log(`🗑️  Cleared ${count} draft(s)`);
    }
    return 0;
  }

  // Handle --flush (default if no other action)
  if (options.flush || (!options.add && !options.list && !options.clear)) {
    if (drafts.items.length === 0) {
      if (options.json) {
        console.log(JSON.stringify({ status: 'ok', message: 'Draft queue is empty', extracted: 0 }));
      } else {
        console.log('Draft queue is empty. Nothing to flush.');
      }
      return 0;
    }

    // Convert drafts to extraction proposals
    const today = new Date().toISOString().split('T')[0];
    const proposals: ExtractionProposal[] = drafts.items.map(draft => {
      const inferred = draft.inferred || {};
      
      // Auto-detect links from fact text
      const links = detectLinksFromFact(draft.fact);
      
      return {
        entityType: (inferred.entityType || 'projects') as any,
        entityName: inferred.entityName || 'unknown',
        fact: draft.fact,
        category: (inferred.category || 'status') as any,
        timestamp: today,
        source: 'draft-flush',
        ...(links.length > 0 && { links }),
      };
    });

    // Validate proposals
    const validation = validateExtractionProposals(proposals);
    if (!validation.valid) {
      if (options.json) {
        console.log(JSON.stringify({
          status: 'error',
          message: 'Some drafts are invalid',
          errors: validation.errors,
        }));
      } else {
        console.error('❌ Cannot flush: Some drafts are invalid');
        validation.errors.forEach(e => console.error(`  - ${e}`));
      }
      return 1;
    }

    // Extract facts
    const result = graph.addFacts(proposals, 'draft-flush');
    
    // Clear drafts after successful extraction
    drafts.items = [];
    writeDrafts(graph.projectRoot, drafts);

    if (options.json) {
      console.log(JSON.stringify({
        status: 'ok',
        action: 'flushed',
        extracted: result.factsAdded,
        superseded: result.factsSuperseded,
        entitiesUpdated: result.entitiesUpdated,
      }));
    } else {
      console.log(`✅ Flushed ${result.factsAdded} fact(s) to knowledge graph`);
      if (result.factsSuperseded > 0) {
        console.log(`   ${result.factsSuperseded} fact(s) superseded`);
      }
      console.log(`   Updated entities: ${result.entitiesUpdated.join(', ')}`);
    }

    return 0;
  }

  // No action specified
  if (options.json) {
    console.log(JSON.stringify({
      status: 'error',
      message: 'No action specified. Use --add, --list, --flush, or --clear',
    }));
  } else {
    console.log('Usage: memo draft [--add <fact>] [--list] [--flush] [--clear]');
  }
  return 1;
}
