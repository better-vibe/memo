import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { MemoryGraph } from './graph';
import { jaccardSimilarity, isDuplicate, detectLinksFromFact } from './facts';

// ─── jaccardSimilarity ──────────────────────────────────────────────

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
    // "Uses", "React" overlap out of 4+3 unique words
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

  it('handles whitespace-only strings', () => {
    expect(jaccardSimilarity('   ', '   ')).toBe(1);
  });

  it('handles single-word strings', () => {
    expect(jaccardSimilarity('React', 'react')).toBe(1);
    expect(jaccardSimilarity('React', 'Vue')).toBe(0);
  });

  it('is commutative', () => {
    const a = 'Uses React for frontend rendering';
    const b = 'Uses Vue for frontend rendering';
    expect(jaccardSimilarity(a, b)).toBe(jaccardSimilarity(b, a));
  });

  it('computes correctly for known overlap', () => {
    // A = {a, b, c}, B = {b, c, d} → intersection=2, union=4 → 0.5
    expect(jaccardSimilarity('a b c', 'b c d')).toBeCloseTo(0.5, 5);
  });
});

// ─── isDuplicate (fuzzy) ─────────────────────────────────────────────

describe('isDuplicate (fuzzy)', () => {
  const makeFact = (text: string, status: 'active' | 'superseded' = 'active') => ({
    id: 'proj-test-001',
    fact: text,
    category: 'dependency' as const,
    timestamp: '2025-01-28',
    source: 'test',
    status,
  });

  it('detects exact duplicates', () => {
    const facts = [makeFact('Uses React 18')];
    expect(isDuplicate(facts, 'Uses React 18')).toBe(true);
  });

  it('detects case-insensitive exact duplicates', () => {
    const facts = [makeFact('Uses React 18')];
    expect(isDuplicate(facts, 'uses react 18')).toBe(true);
  });

  it('allows genuinely different facts', () => {
    const facts = [makeFact('Uses React 18')];
    expect(isDuplicate(facts, 'Uses PostgreSQL for database storage')).toBe(false);
  });

  it('ignores superseded facts in dedup', () => {
    const facts = [makeFact('Uses React 18', 'superseded')];
    expect(isDuplicate(facts, 'Uses React 18')).toBe(false);
  });

  it('respects custom fuzzy threshold', () => {
    const facts = [makeFact('Uses React 18 for frontend UI')];
    // With a very high threshold, only near-exact matches count
    expect(isDuplicate(facts, 'Uses React 18 for frontend UI rendering', 0.99)).toBe(false);
    // With a lower threshold, similar sentences match
    expect(isDuplicate(facts, 'Uses React 18 for frontend UI rendering', 0.7)).toBe(true);
  });

  it('handles empty fact list', () => {
    expect(isDuplicate([], 'anything')).toBe(false);
  });

  it('handles single-word facts', () => {
    const facts = [makeFact('React')];
    expect(isDuplicate(facts, 'React')).toBe(true);
    expect(isDuplicate(facts, 'Vue')).toBe(false);
  });
});

// ─── detectLinksFromFact ─────────────────────────────────────────────

describe('detectLinksFromFact', () => {
  it('detects "Uses X" pattern as library link', () => {
    const links = detectLinksFromFact('Uses React for rendering');
    expect(links.length).toBeGreaterThanOrEqual(1);
    // Regex captures up to 3 words: "React for rendering"
    const reactLink = links.find(l => l.slug === 'react-for-rendering');
    expect(reactLink).toBeDefined();
    expect(reactLink!.relation).toBe('uses');
    expect(reactLink!.entityType).toBe('libraries');
  });

  it('detects "Built with X" pattern', () => {
    const links = detectLinksFromFact('Built with TypeScript');
    expect(links.length).toBeGreaterThanOrEqual(1);
    const tsLink = links.find(l => l.slug === 'typescript');
    expect(tsLink).toBeDefined();
    expect(tsLink!.relation).toBe('uses');
  });

  it('detects "Depends on X" pattern', () => {
    const links = detectLinksFromFact('Depends on PostgreSQL');
    expect(links.length).toBeGreaterThanOrEqual(1);
    const pgLink = links.find(l => l.slug === 'postgresql');
    expect(pgLink).toBeDefined();
    expect(pgLink!.relation).toBe('uses');
  });

  it('detects "Implements X" pattern as pattern link', () => {
    const links = detectLinksFromFact('Implements repository pattern');
    expect(links.length).toBeGreaterThanOrEqual(1);
    const patLink = links.find(l => l.relation === 'implements');
    expect(patLink).toBeDefined();
    expect(patLink!.entityType).toBe('patterns');
  });

  it('detects "Extends X" pattern', () => {
    const links = detectLinksFromFact('Extends base controller');
    const extLink = links.find(l => l.relation === 'extends');
    expect(extLink).toBeDefined();
    expect(extLink!.entityType).toBe('patterns');
  });

  it('detects "Based on X" pattern', () => {
    const links = detectLinksFromFact('Based on microservices architecture');
    const extLink = links.find(l => l.relation === 'extends');
    expect(extLink).toBeDefined();
  });

  it('classifies known project patterns as projects', () => {
    const links = detectLinksFromFact('Uses API backend for data');
    const apiLink = links.find(l => l.slug.includes('api'));
    expect(apiLink).toBeDefined();
    expect(apiLink!.entityType).toBe('projects');
  });

  it('deduplicates links by entity', () => {
    // Same single-word target should be deduped
    const links = detectLinksFromFact('Uses Redis. Also depends on Redis');
    const redisLinks = links.filter(l => l.slug === 'redis');
    expect(redisLinks).toHaveLength(1);
  });

  it('returns empty for text with no link patterns', () => {
    const links = detectLinksFromFact('The sky is blue');
    expect(links).toHaveLength(0);
  });
});

// ─── MemoryGraph verify - expired facts ──────────────────────────────

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

  it('does not warn about facts with future expiresAt', () => {
    graph.addFacts([{
      entityType: 'projects',
      entityName: 'Test',
      fact: 'Valid until next year',
      category: 'status',
      timestamp: '2025-01-01',
      source: 'test',
    }], 'test');

    const itemsPath = path.join(graph.graphRoot, 'projects', 'test', 'items.json');
    const facts = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
    facts[0].expiresAt = '2099-12-31';
    fs.writeFileSync(itemsPath, JSON.stringify(facts, null, 2));

    const result = graph.verify();
    expect(result.warnings.filter(w => w.includes('expired'))).toHaveLength(0);
  });

  it('does not warn about superseded facts with expired dates', () => {
    graph.addFacts([{
      entityType: 'projects',
      entityName: 'Test',
      fact: 'Old version',
      category: 'version',
      timestamp: '2025-01-01',
      source: 'test',
    }], 'test');

    // Supersede by adding a new version
    graph.addFacts([{
      entityType: 'projects',
      entityName: 'Test',
      fact: 'New version',
      category: 'version',
      timestamp: '2025-02-01',
      source: 'test',
    }], 'test');

    // Set an expired date on the superseded fact
    const itemsPath = path.join(graph.graphRoot, 'projects', 'test', 'items.json');
    const facts = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
    facts[0].expiresAt = '2025-01-15'; // superseded fact
    fs.writeFileSync(itemsPath, JSON.stringify(facts, null, 2));

    const result = graph.verify();
    // Should not warn — the fact is already superseded
    expect(result.warnings.filter(w => w.includes('expired'))).toHaveLength(0);
  });
});

// ─── MemoryGraph verify - near-duplicate detection ───────────────────

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

  it('does not warn when one fact is superseded', () => {
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
        status: 'superseded',
        supersededBy: 'proj-test-002',
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
    expect(result.warnings.filter(w => w.includes('potential duplicate'))).toHaveLength(0);
  });

  it('does not warn for genuinely different facts', () => {
    const itemsPath = path.join(graph.graphRoot, 'projects', 'test', 'items.json');
    fs.mkdirSync(path.dirname(itemsPath), { recursive: true });

    const summary = '# Test\n\nLast updated: 2025-01-28\n';
    fs.writeFileSync(path.join(graph.graphRoot, 'projects', 'test', 'summary.md'), summary);

    const facts = [
      {
        id: 'proj-test-001',
        fact: 'Uses React for frontend UI',
        category: 'dependency',
        timestamp: '2025-01-28',
        source: 'test',
        status: 'active',
      },
      {
        id: 'proj-test-002',
        fact: 'PostgreSQL for persistent database storage',
        category: 'dependency',
        timestamp: '2025-01-29',
        source: 'test',
        status: 'active',
      },
    ];
    fs.writeFileSync(itemsPath, JSON.stringify(facts, null, 2));

    const result = graph.verify();
    expect(result.warnings.filter(w => w.includes('potential duplicate'))).toHaveLength(0);
  });
});

// ─── contextCommand ──────────────────────────────────────────────────

describe('contextCommand', () => {
  let tmpDir: string;
  let graph: MemoryGraph;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-context-test-'));
    graph = new MemoryGraph(tmpDir);
    graph.initialize();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // We test contextCommand indirectly by importing and calling it
  // We capture stdout output by temporarily replacing console.log
  function captureStdout(fn: () => Promise<number>): Promise<{ exitCode: number; output: string }> {
    const original = console.log;
    let captured = '';
    console.log = (...args: any[]) => {
      captured += args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') + '\n';
    };
    return fn().then(exitCode => {
      console.log = original;
      return { exitCode, output: captured };
    }).catch(err => {
      console.log = original;
      throw err;
    });
  }

  it('returns error for uninitialized graph', async () => {
    const uninitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-ctx-uninit-'));
    const { contextCommand } = await import('../commands/context');
    const { exitCode } = await captureStdout(() =>
      contextCommand({ project: uninitDir, json: true, compact: false, includeDecisions: false, includeAgents: false })
    );
    expect(exitCode).toBe(1);
    fs.rmSync(uninitDir, { recursive: true, force: true });
  });

  it('produces JSON output with graph stats', async () => {
    graph.addFacts([
      { entityType: 'projects', entityName: 'App', fact: 'Uses TypeScript', category: 'dependency', timestamp: '2026-01-01', source: 'test', confidence: 1.0 },
      { entityType: 'libraries', entityName: 'React', fact: 'Version 18', category: 'version', timestamp: '2026-01-01', source: 'test', confidence: 0.9 },
    ], 'test');

    const { contextCommand } = await import('../commands/context');
    const { exitCode, output } = await captureStdout(() =>
      contextCommand({ project: tmpDir, json: true, compact: false, includeDecisions: false, includeAgents: false })
    );

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output);
    expect(parsed.status).toBe('ok');
    expect(parsed.graphStats.entityCount).toBe(2);
    expect(parsed.graphStats.activeFactCount).toBe(2);
    expect(parsed.graphStats.categoryBreakdown).toHaveProperty('dependency');
    expect(parsed.graphStats.categoryBreakdown).toHaveProperty('version');
    expect(parsed.entities).toHaveLength(2);
  });

  it('filters by entity type', async () => {
    graph.addFacts([
      { entityType: 'projects', entityName: 'App', fact: 'A project', category: 'status', timestamp: '2026-01-01', source: 'test' },
      { entityType: 'libraries', entityName: 'React', fact: 'A library', category: 'status', timestamp: '2026-01-01', source: 'test' },
    ], 'test');

    const { contextCommand } = await import('../commands/context');
    const { exitCode, output } = await captureStdout(() =>
      contextCommand({ project: tmpDir, json: true, compact: false, includeDecisions: false, includeAgents: false, entityType: 'projects' })
    );

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output);
    expect(parsed.entities).toHaveLength(1);
    expect(parsed.entities[0].type).toBe('projects');
  });

  it('filters by specific entity', async () => {
    graph.addFacts([
      { entityType: 'projects', entityName: 'App', fact: 'A project', category: 'status', timestamp: '2026-01-01', source: 'test' },
      { entityType: 'projects', entityName: 'Other', fact: 'Another', category: 'status', timestamp: '2026-01-01', source: 'test' },
    ], 'test');

    const { contextCommand } = await import('../commands/context');
    const { exitCode, output } = await captureStdout(() =>
      contextCommand({ project: tmpDir, json: true, compact: false, includeDecisions: false, includeAgents: false, entity: 'projects/app' })
    );

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output);
    expect(parsed.entities).toHaveLength(1);
    expect(parsed.entities[0].slug).toBe('app');
  });

  it('limits facts per entity with maxFacts', async () => {
    graph.addFacts([
      { entityType: 'projects', entityName: 'App', fact: 'Fact one', category: 'status', timestamp: '2026-01-01', source: 'test' },
      { entityType: 'projects', entityName: 'App', fact: 'Fact two about architecture', category: 'architecture', timestamp: '2026-01-02', source: 'test' },
      { entityType: 'projects', entityName: 'App', fact: 'Fact three about rules', category: 'rule', timestamp: '2026-01-03', source: 'test' },
    ], 'test');

    const { contextCommand } = await import('../commands/context');
    const { exitCode, output } = await captureStdout(() =>
      contextCommand({ project: tmpDir, json: true, compact: false, includeDecisions: false, includeAgents: false, maxFacts: '2' })
    );

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output);
    expect(parsed.entities[0].factCount).toBeLessThanOrEqual(2);
  });

  it('ranks facts by confidence then recency', async () => {
    graph.addFacts([
      { entityType: 'projects', entityName: 'App', fact: 'Low confidence old', category: 'status', timestamp: '2025-01-01', source: 'test', confidence: 0.3 },
      { entityType: 'projects', entityName: 'App', fact: 'High confidence fact', category: 'architecture', timestamp: '2025-06-01', source: 'test', confidence: 1.0 },
      { entityType: 'projects', entityName: 'App', fact: 'Medium confidence recent', category: 'rule', timestamp: '2026-01-01', source: 'test', confidence: 0.7 },
    ], 'test');

    const { contextCommand } = await import('../commands/context');
    const { exitCode, output } = await captureStdout(() =>
      contextCommand({ project: tmpDir, json: true, compact: false, includeDecisions: false, includeAgents: false })
    );

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output);
    const facts = parsed.entities[0].facts;
    // High confidence should be first
    expect(facts[0].confidence).toBe(1.0);
    // Low confidence should be last
    expect(facts[facts.length - 1].confidence).toBe(0.3);
  });

  it('excludes expired facts', async () => {
    graph.addFacts([
      { entityType: 'projects', entityName: 'App', fact: 'Valid fact', category: 'status', timestamp: '2026-01-01', source: 'test' },
      { entityType: 'projects', entityName: 'App', fact: 'Expired fact', category: 'constraint', timestamp: '2025-01-01', source: 'test' },
    ], 'test');

    // Manually set expiresAt on the second fact
    const itemsPath = path.join(graph.graphRoot, 'projects', 'app', 'items.json');
    const facts = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
    facts[1].expiresAt = '2025-06-01';
    fs.writeFileSync(itemsPath, JSON.stringify(facts, null, 2));

    const { contextCommand } = await import('../commands/context');
    const { exitCode, output } = await captureStdout(() =>
      contextCommand({ project: tmpDir, json: true, compact: false, includeDecisions: false, includeAgents: false })
    );

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output);
    expect(parsed.entities[0].factCount).toBe(1);
    expect(parsed.entities[0].facts[0].fact).toBe('Valid fact');
  });

  it('includes DECISIONS.md when requested', async () => {
    graph.addFacts([
      { entityType: 'projects', entityName: 'App', fact: 'A fact', category: 'status', timestamp: '2026-01-01', source: 'test' },
    ], 'test');

    // Create a DECISIONS.md
    fs.writeFileSync(path.join(tmpDir, 'DECISIONS.md'), '# Decisions\n\nSome decisions here.');

    const { contextCommand } = await import('../commands/context');
    const { exitCode, output } = await captureStdout(() =>
      contextCommand({ project: tmpDir, json: true, compact: false, includeDecisions: true, includeAgents: false })
    );

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output);
    expect(parsed.decisions).toContain('Decisions');
  });

  it('rejects invalid entity path', async () => {
    const { contextCommand } = await import('../commands/context');
    const { exitCode } = await captureStdout(() =>
      contextCommand({ project: tmpDir, json: true, compact: false, includeDecisions: false, includeAgents: false, entity: 'invalid-no-slash' })
    );
    expect(exitCode).toBe(1);
  });
});

// ─── statusCommand --detailed ────────────────────────────────────────

describe('statusCommand --detailed', () => {
  let tmpDir: string;
  let graph: MemoryGraph;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-status-test-'));
    graph = new MemoryGraph(tmpDir);
    graph.initialize();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function captureStdout(fn: () => Promise<number>): Promise<{ exitCode: number; output: string }> {
    const original = console.log;
    let captured = '';
    console.log = (...args: any[]) => {
      captured += args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') + '\n';
    };
    return fn().then(exitCode => {
      console.log = original;
      return { exitCode, output: captured };
    }).catch(err => {
      console.log = original;
      throw err;
    });
  }

  it('returns detailed JSON with category and link breakdowns', async () => {
    graph.addFacts([
      { entityType: 'projects', entityName: 'App', fact: 'Uses TypeScript', category: 'dependency', timestamp: '2026-01-01', source: 'test' },
      { entityType: 'projects', entityName: 'App', fact: 'In production', category: 'status', timestamp: '2026-01-01', source: 'test' },
      { entityType: 'libraries', entityName: 'React', fact: 'Version 18', category: 'version', timestamp: '2026-01-01', source: 'test' },
    ], 'test');

    const { statusCommand } = await import('../commands/status');
    const { exitCode, output } = await captureStdout(() =>
      statusCommand({ project: tmpDir, json: true, audit: false, detailed: true })
    );

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output);
    expect(parsed.status).toBe('ok');
    expect(parsed.entityCount).toBe(2);
    expect(parsed.activeFacts).toBe(3);
    expect(parsed.entityTypeCount.projects).toBe(1);
    expect(parsed.entityTypeCount.libraries).toBe(1);
    expect(parsed.categoryBreakdown).toHaveProperty('dependency');
    expect(parsed.categoryBreakdown).toHaveProperty('status');
    expect(parsed.categoryBreakdown).toHaveProperty('version');
    expect(parsed.linkStats).toBeDefined();
  });

  it('reports expired fact count', async () => {
    graph.addFacts([
      { entityType: 'projects', entityName: 'App', fact: 'An expired constraint', category: 'constraint', timestamp: '2025-01-01', source: 'test' },
    ], 'test');

    const itemsPath = path.join(graph.graphRoot, 'projects', 'app', 'items.json');
    const facts = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
    facts[0].expiresAt = '2025-06-01';
    fs.writeFileSync(itemsPath, JSON.stringify(facts, null, 2));

    const { statusCommand } = await import('../commands/status');
    const { exitCode, output } = await captureStdout(() =>
      statusCommand({ project: tmpDir, json: true, audit: false, detailed: false })
    );

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output);
    expect(parsed.expiredFacts).toBe(1);
  });
});

// ─── queryCommand - tag and expired filters ──────────────────────────

describe('queryCommand - tag and expired filters', () => {
  let tmpDir: string;
  let graph: MemoryGraph;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-query-test-'));
    graph = new MemoryGraph(tmpDir);
    graph.initialize();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function captureStdout(fn: () => Promise<number>): Promise<{ exitCode: number; output: string }> {
    const original = console.log;
    let captured = '';
    console.log = (...args: any[]) => {
      captured += args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') + '\n';
    };
    return fn().then(exitCode => {
      console.log = original;
      return { exitCode, output: captured };
    }).catch(err => {
      console.log = original;
      throw err;
    });
  }

  it('filters by tag', async () => {
    graph.addFacts([
      { entityType: 'projects', entityName: 'App', fact: 'A blocking bug', category: 'bug', timestamp: '2026-01-01', source: 'test' },
      { entityType: 'projects', entityName: 'App', fact: 'Normal status', category: 'status', timestamp: '2026-01-01', source: 'test' },
    ], 'test');

    // Manually add tags to the first fact
    const itemsPath = path.join(graph.graphRoot, 'projects', 'app', 'items.json');
    const facts = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
    facts[0].tags = ['blocking', 'security'];
    fs.writeFileSync(itemsPath, JSON.stringify(facts, null, 2));

    const { queryCommand } = await import('../commands/query');
    const { exitCode, output } = await captureStdout(() =>
      queryCommand({ project: tmpDir, json: true, tag: 'blocking' })
    );

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output);
    expect(parsed.count).toBe(1);
    expect(parsed.results[0].fact).toBe('A blocking bug');
  });

  it('filters by multiple tags with AND logic', async () => {
    graph.addFacts([
      { entityType: 'projects', entityName: 'App', fact: 'Blocking security issue', category: 'bug', timestamp: '2026-01-01', source: 'test' },
      { entityType: 'projects', entityName: 'App', fact: 'Just blocking', category: 'bug', timestamp: '2026-01-02', source: 'test' },
    ], 'test');

    const itemsPath = path.join(graph.graphRoot, 'projects', 'app', 'items.json');
    const facts = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
    facts[0].tags = ['blocking', 'security'];
    facts[1].tags = ['blocking'];
    fs.writeFileSync(itemsPath, JSON.stringify(facts, null, 2));

    const { queryCommand } = await import('../commands/query');
    const { exitCode, output } = await captureStdout(() =>
      queryCommand({ project: tmpDir, json: true, tag: 'blocking,security' })
    );

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output);
    expect(parsed.count).toBe(1);
    expect(parsed.results[0].fact).toBe('Blocking security issue');
  });

  it('excludes expired facts', async () => {
    graph.addFacts([
      { entityType: 'projects', entityName: 'App', fact: 'Active constraint', category: 'constraint', timestamp: '2026-01-01', source: 'test' },
      { entityType: 'projects', entityName: 'App', fact: 'Expired constraint', category: 'rule', timestamp: '2025-01-01', source: 'test' },
    ], 'test');

    const itemsPath = path.join(graph.graphRoot, 'projects', 'app', 'items.json');
    const facts = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
    facts[1].expiresAt = '2025-06-01';
    fs.writeFileSync(itemsPath, JSON.stringify(facts, null, 2));

    const { queryCommand } = await import('../commands/query');
    const { exitCode, output } = await captureStdout(() =>
      queryCommand({ project: tmpDir, json: true, excludeExpired: true })
    );

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output);
    expect(parsed.count).toBe(1);
    expect(parsed.results[0].fact).toBe('Active constraint');
  });

  it('includes expired facts when excludeExpired is not set', async () => {
    graph.addFacts([
      { entityType: 'projects', entityName: 'App', fact: 'Active fact', category: 'status', timestamp: '2026-01-01', source: 'test' },
      { entityType: 'projects', entityName: 'App', fact: 'Expired fact', category: 'rule', timestamp: '2025-01-01', source: 'test' },
    ], 'test');

    const itemsPath = path.join(graph.graphRoot, 'projects', 'app', 'items.json');
    const facts = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
    facts[1].expiresAt = '2025-06-01';
    fs.writeFileSync(itemsPath, JSON.stringify(facts, null, 2));

    const { queryCommand } = await import('../commands/query');
    const { exitCode, output } = await captureStdout(() =>
      queryCommand({ project: tmpDir, json: true })
    );

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output);
    expect(parsed.count).toBe(2);
  });
});
