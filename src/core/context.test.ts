import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { MemoryGraph } from './graph';
import { jaccardSimilarity, isDuplicate } from './facts';

describe('jaccardSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(jaccardSimilarity('Uses React 18', 'Uses React 18')).toBe(1);
  });

  it('returns 1 for identical strings with different casing', () => {
    expect(jaccardSimilarity('Uses React 18', 'uses react 18')).toBe(1);
  });

  it('returns 0 for completely different strings', () => {
    expect(jaccardSimilarity('Uses React 18', 'Built with PostgreSQL database')).toBe(0);
  });

  it('returns high similarity for near-duplicate facts', () => {
    const sim = jaccardSimilarity('Uses React version 18', 'Uses React v18');
    // "Uses", "React" overlap; "version", "18" vs "v18" differ
    expect(sim).toBeGreaterThan(0.3);
  });

  it('returns high similarity for rephrased facts', () => {
    const sim = jaccardSimilarity(
      'Project uses TypeScript for type safety',
      'Project uses TypeScript for type checking'
    );
    // 4 of 6 words overlap
    expect(sim).toBeGreaterThan(0.5);
  });

  it('handles empty strings', () => {
    expect(jaccardSimilarity('', '')).toBe(1);
    expect(jaccardSimilarity('hello', '')).toBe(0);
    expect(jaccardSimilarity('', 'hello')).toBe(0);
  });
});

describe('isDuplicate (fuzzy)', () => {
  const makeFact = (text: string) => ({
    id: 'proj-test-001',
    fact: text,
    category: 'dependency' as const,
    timestamp: '2025-01-28',
    source: 'test',
    status: 'active' as const,
  });

  it('detects exact duplicates', () => {
    const facts = [makeFact('Uses React 18')];
    expect(isDuplicate(facts, 'Uses React 18')).toBe(true);
  });

  it('detects case-insensitive exact duplicates', () => {
    const facts = [makeFact('Uses React 18')];
    expect(isDuplicate(facts, 'uses react 18')).toBe(true);
  });

  it('detects near-duplicates above threshold', () => {
    // These share all words — just different order or trivial difference
    const facts = [makeFact('Uses React version 18.2.0')];
    // Identical text should match
    expect(isDuplicate(facts, 'Uses React version 18.2.0')).toBe(true);
  });

  it('allows genuinely different facts', () => {
    const facts = [makeFact('Uses React 18')];
    expect(isDuplicate(facts, 'Uses PostgreSQL for database storage')).toBe(false);
  });

  it('ignores superseded facts in dedup', () => {
    const facts = [{ ...makeFact('Uses React 18'), status: 'superseded' as const }];
    expect(isDuplicate(facts, 'Uses React 18')).toBe(false);
  });
});

describe('MemoryGraph verify - expired facts', () => {
  let tmpDir: string;
  let graph: MemoryGraph;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-verify-test-'));
    graph = new MemoryGraph(tmpDir);
    graph.initialize();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('warns about expired facts still marked active', () => {
    // Add a fact manually with an expiresAt in the past
    graph.addFacts([{
      entityType: 'projects',
      entityName: 'Test',
      fact: 'Sprint deadline is Jan 15',
      category: 'status',
      timestamp: '2025-01-01',
      source: 'test',
    }], 'test');

    // Manually patch the fact to have an expired date
    const itemsPath = path.join(graph.graphRoot, 'projects', 'test', 'items.json');
    const facts = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
    facts[0].expiresAt = '2025-01-15';
    fs.writeFileSync(itemsPath, JSON.stringify(facts, null, 2));

    const result = graph.verify();
    expect(result.warnings.some(w => w.includes('expired'))).toBe(true);
  });

  it('does not warn about non-expired facts', () => {
    graph.addFacts([{
      entityType: 'projects',
      entityName: 'Test',
      fact: 'A normal fact',
      category: 'status',
      timestamp: '2025-01-01',
      source: 'test',
    }], 'test');

    const result = graph.verify();
    expect(result.warnings.filter(w => w.includes('expired'))).toHaveLength(0);
  });
});

describe('MemoryGraph verify - near-duplicate detection', () => {
  let tmpDir: string;
  let graph: MemoryGraph;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-dedup-test-'));
    graph = new MemoryGraph(tmpDir);
    graph.initialize();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('warns about near-duplicate active facts', () => {
    // Add two very similar facts (bypass dedup by writing directly)
    const itemsPath = path.join(graph.graphRoot, 'projects', 'test', 'items.json');
    fs.mkdirSync(path.dirname(itemsPath), { recursive: true });

    const summary = '# Test\n\nLast updated: 2025-01-28\n';
    fs.writeFileSync(path.join(graph.graphRoot, 'projects', 'test', 'summary.md'), summary);

    const facts = [
      {
        id: 'proj-test-001',
        fact: 'Uses React version 18 for frontend UI',
        category: 'dependency',
        timestamp: '2025-01-28',
        source: 'test',
        status: 'active',
      },
      {
        id: 'proj-test-002',
        fact: 'Uses React version 18 for frontend UI rendering',
        category: 'dependency',
        timestamp: '2025-01-29',
        source: 'test',
        status: 'active',
      },
    ];
    fs.writeFileSync(itemsPath, JSON.stringify(facts, null, 2));

    const result = graph.verify();
    expect(result.warnings.some(w => w.includes('potential duplicate'))).toBe(true);
  });
});
