import * as fs from 'fs';
import * as path from 'path';
import { EntityType, ENTITY_TYPES, slugify, entityExists, createEntity, listEntities, updateEntityCache, formatDisplayName } from './entity';
import { FactItem, ExtractionProposal } from './validation';
import { readFacts, writeFacts, generateId, entityTypeAbbr, isDuplicate, findContradictions, supersedeFact, getActiveFacts, atomicWriteText, detectLinksFromFact, createReverseLink } from './facts';
import { appendAudit } from './audit';
import * as entityMod from './entity';

export interface MemoryGraphOptions {
  projectRoot: string;
}

export class MemoryGraph {
  public readonly projectRoot: string;
  public readonly memoryRoot: string;
  public readonly graphRoot: string;
  public readonly metaRoot: string;
  public readonly agentsPath: string;
  public readonly decisionsPath: string;

  constructor(projectRoot: string) {
    this.projectRoot = path.resolve(projectRoot);
    this.memoryRoot = path.join(this.projectRoot, 'memory');
    this.graphRoot = path.join(this.memoryRoot, 'graph');
    this.metaRoot = path.join(this.memoryRoot, '_meta');
    this.agentsPath = path.join(this.projectRoot, 'AGENTS.md');
    this.decisionsPath = path.join(this.projectRoot, 'DECISIONS.md');
  }

  isInitialized(): boolean {
    return fs.existsSync(this.graphRoot);
  }

  initialize(): void {
    for (const t of ENTITY_TYPES) {
      fs.mkdirSync(path.join(this.graphRoot, t), { recursive: true });
    }
    fs.mkdirSync(this.metaRoot, { recursive: true });
  }

  listEntities(entityType?: EntityType) {
    return listEntities(this.graphRoot, entityType);
  }

  entityExists(entityType: EntityType, slug: string): boolean {
    return entityExists(this.graphRoot, entityType, slug);
  }

  createEntity(entityType: EntityType, name: string, description?: string): string {
    const slug = slugify(name);
    const displayName = formatDisplayName(name);
    createEntity(this.graphRoot, entityType, slug, displayName, description);
    updateEntityCache(this.metaRoot, name, slug);
    return slug;
  }

  readFacts(entityType: EntityType, slug: string): FactItem[] {
    return readFacts(entityMod.itemsPath(this.graphRoot, entityType, slug));
  }

  getActiveFacts(entityType: EntityType, slug: string): FactItem[] {
    return getActiveFacts(this.readFacts(entityType, slug));
  }

  readSummary(entityType: EntityType, slug: string): string {
    const p = entityMod.summaryPath(this.graphRoot, entityType, slug);
    if (!fs.existsSync(p)) return '';
    return fs.readFileSync(p, 'utf-8');
  }

  writeSummary(entityType: EntityType, slug: string, content: string): void {
    atomicWriteText(entityMod.summaryPath(this.graphRoot, entityType, slug), content);
  }

  /**
   * Add facts from extraction proposals. Returns count of facts added.
   */
  addFacts(proposals: ExtractionProposal[], source: string): { factsAdded: number; entitiesUpdated: string[]; factsSuperseded: number } {
    let factsAdded = 0;
    let factsSuperseded = 0;
    const entitiesUpdated = new Set<string>();

    for (const proposal of proposals) {
      const entityType = proposal.entityType as EntityType;
      const slug = slugify(proposal.entityName);
      const entityKey = `${entityType}/${slug}`;

      // Auto-create entity if needed
      if (!this.entityExists(entityType, slug)) {
        this.createEntity(entityType, proposal.entityName);
      }

      const itemsFile = entityMod.itemsPath(this.graphRoot, entityType, slug);
      let facts = readFacts(itemsFile);

      // Dedup
      if (isDuplicate(facts, proposal.fact)) continue;

      const id = generateId(entityTypeAbbr(entityType), slug, facts);

      // Handle contradictions
      const contradictions = findContradictions(facts, proposal.category, proposal.fact);
      for (const c of contradictions) {
        facts = supersedeFact(facts, c.id, id);
        factsSuperseded++;
      }

      // Auto-detect links if not explicitly provided
      let links = proposal.links;
      if (!links) {
        links = detectLinksFromFact(proposal.fact);
      }

      const newFact: FactItem = {
        id,
        fact: proposal.fact,
        category: proposal.category,
        timestamp: proposal.timestamp,
        source: proposal.source,
        status: 'active',
        ...(proposal.confidence !== undefined && { confidence: proposal.confidence }),
        ...(proposal.evidence !== undefined && { evidence: proposal.evidence }),
        ...(links && links.length > 0 && { links }),
      };

      // Create bidirectional reverse links
      if (links && links.length > 0) {
        for (const link of links) {
          createReverseLink(this.graphRoot, entityType, slug, link, newFact.id);
        }
      }

      facts.push(newFact);
      writeFacts(itemsFile, facts);
      factsAdded++;
      entitiesUpdated.add(entityKey);
    }

    if (factsAdded > 0) {
      appendAudit(this.metaRoot, {
        operation: 'extract',
        source,
        entitiesAffected: [...entitiesUpdated],
        factsAdded,
        factsSuperseded,
        status: 'ok',
      });
    }

    return { factsAdded, entitiesUpdated: [...entitiesUpdated], factsSuperseded };
  }

  /**
   * Verify graph consistency.
   */
  verify(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const { type, slug } of this.listEntities()) {
      // Check items.json validity
      try {
        const facts = this.readFacts(type, slug);
        // Check for superseded facts pointing to non-existent IDs
        for (const f of facts) {
          if (f.status === 'superseded' && f.supersededBy) {
            if (!facts.find(ff => ff.id === f.supersededBy)) {
              warnings.push(`${type}/${slug}: fact ${f.id} superseded by unknown ${f.supersededBy}`);
            }
          }
        }
        // Check for duplicate IDs
        const ids = facts.map(f => f.id);
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
        if (dupes.length > 0) {
          errors.push(`${type}/${slug}: duplicate fact IDs: ${dupes.join(', ')}`);
        }
      } catch (err: any) {
        errors.push(`${type}/${slug}: ${err.message}`);
      }

      // Check summary exists
      const sp = entityMod.summaryPath(this.graphRoot, type, slug);
      if (!fs.existsSync(sp)) {
        warnings.push(`${type}/${slug}: missing summary.md`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
