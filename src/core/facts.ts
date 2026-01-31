import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FactItem, FactItemsArraySchema, Link, EntityType } from './validation';
import * as entityMod from './entity';

/**
 * Atomic write: write to temp file then rename.
 */
export function atomicWriteJSON(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const random = crypto.randomBytes(4).toString('hex');
  const tmp = path.join(dir, `.tmp-${process.pid}-${Date.now()}-${random}.json`);
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    fs.renameSync(tmp, filePath);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    throw err;
  }
}

export function atomicWriteText(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const random = crypto.randomBytes(4).toString('hex');
  const tmp = path.join(dir, `.tmp-${process.pid}-${Date.now()}-${random}`);
  try {
    fs.writeFileSync(tmp, content, 'utf-8');
    fs.renameSync(tmp, filePath);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    throw err;
  }
}

export function readFacts(itemsJsonPath: string): FactItem[] {
  if (!fs.existsSync(itemsJsonPath)) return [];
  const raw = fs.readFileSync(itemsJsonPath, 'utf-8');
  const parsed = JSON.parse(raw);
  const result = FactItemsArraySchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid items.json at ${itemsJsonPath}: ${result.error.message}`);
  }
  return result.data;
}

export function writeFacts(itemsJsonPath: string, facts: FactItem[]): void {
  atomicWriteJSON(itemsJsonPath, facts);
}

export function generateId(entityTypeAbbr: string, slug: string, existingFacts: FactItem[]): string {
  const prefix = `${entityTypeAbbr}-${slug}-`;
  let max = 0;
  for (const f of existingFacts) {
    if (f.id.startsWith(prefix)) {
      const num = parseInt(f.id.slice(prefix.length), 10);
      if (!isNaN(num) && num > max) max = num;
    }
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export function entityTypeAbbr(entityType: string): string {
  const map: Record<string, string> = {
    projects: 'proj',
    libraries: 'lib',
    patterns: 'pat',
  };
  return map[entityType] || entityType.slice(0, 4);
}

/**
 * Check if a new fact duplicates an existing active fact.
 * Simple substring/similarity check.
 */
export function isDuplicate(existingFacts: FactItem[], newFact: string): boolean {
  const normalized = newFact.toLowerCase().trim();
  return existingFacts.some(
    f => f.status === 'active' && f.fact.toLowerCase().trim() === normalized,
  );
}

/**
 * Find active facts that may contradict a new fact (same category, same entity).
 * Returns facts that should potentially be superseded.
 */
export function findContradictions(existingFacts: FactItem[], newCategory: string, newFact: string): FactItem[] {
  // For version facts, only existing version facts contradict
  if (newCategory === 'version') {
    return existingFacts.filter(
      f => f.status === 'active' && f.category === 'version',
    );
  }
  // For dependency facts, only existing dependency facts contradict
  if (newCategory === 'dependency') {
    return existingFacts.filter(
      f => f.status === 'active' && f.category === 'dependency',
    );
  }
  return [];
}

export function supersedeFact(facts: FactItem[], oldId: string, newId: string): FactItem[] {
  return facts.map(f => {
    if (f.id === oldId) {
      return { ...f, status: 'superseded' as const, supersededBy: newId };
    }
    return f;
  });
}

export function getActiveFacts(facts: FactItem[]): FactItem[] {
  return facts.filter(f => f.status === 'active');
}

/**
 * Detect entity links from fact text using heuristics
 */
export function detectLinksFromFact(factText: string): Link[] {
  const links: Link[] = [];
  
  // Pattern: "Uses X" or "Uses X for Y"
  const usesPattern = /\b(?:uses?|using|built with|depends on)\s+(?:the\s+)?(\w+(?:\s+\w+){0,2})/gi;
  let match;
  while ((match = usesPattern.exec(factText)) !== null) {
    const targetName = match[1].trim();
    const targetSlug = targetName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Determine entity type based on name patterns
    let targetType: EntityType = 'libraries';
    if (targetName.match(/pattern|architecture|strategy|approach/i)) {
      targetType = 'patterns';
    }
    if (targetName.match(/app|project|service|api|backend|frontend/i)) {
      targetType = 'projects';
    }
    
    links.push({
      entityType: targetType,
      slug: targetSlug,
      relation: 'uses',
    });
  }
  
  // Pattern: "Implements X" or "Follows X pattern"
  const implementsPattern = /\b(?:implements?|follows?|applies?)\s+(?:the\s+)?(\w+(?:\s+\w+){0,2})(?:\s+pattern)?/gi;
  while ((match = implementsPattern.exec(factText)) !== null) {
    const targetName = match[1].trim();
    const targetSlug = targetName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    links.push({
      entityType: 'patterns',
      slug: targetSlug,
      relation: 'implements',
    });
  }
  
  // Pattern: "Extends X" or "Based on X"
  const extendsPattern = /\b(?:extends?|based on|derived from)\s+(?:the\s+)?(\w+(?:\s+\w+){0,2})/gi;
  while ((match = extendsPattern.exec(factText)) !== null) {
    const targetName = match[1].trim();
    const targetSlug = targetName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    links.push({
      entityType: 'patterns',
      slug: targetSlug,
      relation: 'extends',
    });
  }
  
  // Remove duplicates
  const seen = new Set<string>();
  return links.filter(link => {
    const key = `${link.entityType}/${link.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Create a reverse link in the target entity
 * When A uses B, create a "usedBy" reference in B pointing back to A
 */
export function createReverseLink(
  graphRoot: string,
  sourceType: EntityType,
  sourceSlug: string,
  link: Link,
  sourceFactId: string,
): void {
  const targetItemsFile = entityMod.itemsPath(graphRoot, link.entityType, link.slug);
  
  // Only create reverse link if target entity exists
  if (!fs.existsSync(targetItemsFile)) {
    return;
  }
  
  try {
    const targetFacts = readFacts(targetItemsFile);
    
    // Create a synthetic fact representing the reverse relationship
    const reverseRelation = getReverseRelation(link.relation);
    const reverseLink: Link = {
      entityType: sourceType,
      slug: sourceSlug,
      relation: reverseRelation as any, // Type assertion needed due to schema flexibility
    };
    const reverseFact: FactItem = {
      id: `link-${sourceType}-${sourceSlug}-${Date.now()}`,
      fact: `${reverseRelation} ${sourceType}/${sourceSlug}`,
      category: 'dependency',
      timestamp: new Date().toISOString().split('T')[0],
      source: 'auto-link',
      status: 'active',
      links: [reverseLink],
    };
    
    targetFacts.push(reverseFact);
    writeFacts(targetItemsFile, targetFacts);
  } catch (err) {
    // Silently fail - reverse links are best-effort
  }
}

type Relation = 'uses' | 'implements' | 'depends_on' | 'extends' | 'references' | 'used_by' | 'implemented_by' | 'depended_on_by' | 'extended_by' | 'referenced_by' | 'related_to';

/**
 * Get the reverse relation name
 */
function getReverseRelation(relation: string): Relation {
  const reverses: Record<string, Relation> = {
    uses: 'used_by',
    implements: 'implemented_by',
    extends: 'extended_by',
    depends_on: 'depended_on_by',
    references: 'referenced_by',
  };
  return reverses[relation] || 'referenced_by';
}
