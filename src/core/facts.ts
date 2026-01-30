import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FactItem, FactItemsArraySchema } from './validation';

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
    developers: 'dev',
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
