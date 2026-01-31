import * as fs from 'fs';
import * as path from 'path';
import { atomicWriteText, atomicWriteJSON } from './facts';

export const ENTITY_TYPES = ['projects', 'libraries', 'patterns'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

/**
 * Convert a name to a URL-friendly slug
 * Handles org prefixes (e.g., @org/repo) gracefully
 * 
 * Examples:
 * - "My Project" → "my-project"
 * - "@better-vibe/memo" → "better-vibe-memo"
 * - "React" → "react"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Handle org prefixes: @org/repo → org-repo
    .replace(/^@/, '')
    .replace(/\/+/g, '-')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Get a display name from a slug for use in summaries
 * Converts dash-separated words to title case
 * 
 * Examples:
 * - "better-vibe-memo" → "Better Vibe Memo"
 * - "my-project" → "My Project"
 */
export function displayNameFromSlug(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Create a clean display name from original name
 * Preserves org prefixes and formatting
 * 
 * Examples:
 * - "@better-vibe/memo" → "@better-vibe/memo"
 * - "my-project" → "My Project"
 * - "My Project" → "My Project"
 */
export function formatDisplayName(name: string): string {
  const trimmed = name.trim();
  
  // If it has an org prefix, preserve it
  if (trimmed.startsWith('@')) {
    return trimmed;
  }
  
  // If already title case or has spaces, return as-is
  if (/[A-Z]/.test(trimmed) && /\s/.test(trimmed)) {
    return trimmed;
  }
  
  // Otherwise, convert from slug-like format
  return displayNameFromSlug(trimmed);
}

export function entityPath(graphRoot: string, entityType: EntityType, slug: string): string {
  return path.join(graphRoot, entityType, slug);
}

export function summaryPath(graphRoot: string, entityType: EntityType, slug: string): string {
  return path.join(entityPath(graphRoot, entityType, slug), 'summary.md');
}

export function itemsPath(graphRoot: string, entityType: EntityType, slug: string): string {
  return path.join(entityPath(graphRoot, entityType, slug), 'items.json');
}

export function entityExists(graphRoot: string, entityType: EntityType, slug: string): boolean {
  return fs.existsSync(entityPath(graphRoot, entityType, slug));
}

export function createEntity(
  graphRoot: string,
  entityType: EntityType,
  slug: string,
  displayName: string,
  description?: string,
): void {
  const dir = entityPath(graphRoot, entityType, slug);
  fs.mkdirSync(dir, { recursive: true });

  const today = new Date().toISOString().split('T')[0];
  const summary = `# ${displayName}\n\n${description || ''}\n\nLast updated: ${today}\n`;
  atomicWriteText(summaryPath(graphRoot, entityType, slug), summary);
  atomicWriteJSON(itemsPath(graphRoot, entityType, slug), []);
}

export function listEntities(graphRoot: string, entityType?: EntityType): { type: EntityType; slug: string }[] {
  const types = entityType ? [entityType] : [...ENTITY_TYPES];
  const results: { type: EntityType; slug: string }[] = [];
  for (const t of types) {
    const dir = path.join(graphRoot, t);
    if (!fs.existsSync(dir)) continue;
    for (const slug of fs.readdirSync(dir)) {
      const full = path.join(dir, slug);
      if (fs.statSync(full).isDirectory()) {
        results.push({ type: t, slug });
      }
    }
  }
  return results;
}

export function resolveEntitySlug(graphRoot: string, entityType: EntityType, name: string): string {
  const slug = slugify(name);
  // Check entity cache
  const cachePath = path.join(graphRoot, '..', '_meta', 'entities.json');
  if (fs.existsSync(cachePath)) {
    try {
      const cache: Record<string, string> = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      if (cache[name]) return cache[name];
    } catch { /* ignore */ }
  }
  return slug;
}

export function updateEntityCache(metaRoot: string, name: string, slug: string): void {
  const cachePath = path.join(metaRoot, 'entities.json');
  let cache: Record<string, string> = {};
  if (fs.existsSync(cachePath)) {
    try { cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8')); } catch { /* ignore */ }
  }
  cache[name] = slug;
  atomicWriteJSON(cachePath, cache);
}
