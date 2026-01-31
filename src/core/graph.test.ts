import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { MemoryGraph } from './graph';

describe('MemoryGraph', () => {
  let tmpDir: string;
  let graph: MemoryGraph;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-graph-test-'));
    graph = new MemoryGraph(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('initializes graph structure', () => {
    expect(graph.isInitialized()).toBe(false);
    graph.initialize();
    expect(graph.isInitialized()).toBe(true);
    expect(fs.existsSync(path.join(graph.graphRoot, 'projects'))).toBe(true);
    expect(fs.existsSync(path.join(graph.graphRoot, 'libraries'))).toBe(true);
    expect(fs.existsSync(path.join(graph.graphRoot, 'patterns'))).toBe(true);
  });

  it('creates and lists entities', () => {
    graph.initialize();
    graph.createEntity('projects', 'My Project', 'A test project');
    const entities = graph.listEntities();
    expect(entities).toEqual([{ type: 'projects', slug: 'my-project' }]);
  });

  it('adds facts and reads them back', () => {
    graph.initialize();
    const result = graph.addFacts([
      {
        entityType: 'libraries',
        entityName: 'React',
        fact: 'Version 18.2.0',
        category: 'version',
        timestamp: '2025-01-28',
        source: 'test',
        confidence: 0.9,
      },
    ], 'test');

    expect(result.factsAdded).toBe(1);
    expect(result.entitiesUpdated).toContain('libraries/react');

    const facts = graph.readFacts('libraries', 'react');
    expect(facts).toHaveLength(1);
    expect(facts[0].fact).toBe('Version 18.2.0');
    expect(facts[0].status).toBe('active');
  });

  it('deduplicates identical facts', () => {
    graph.initialize();
    const proposal = {
      entityType: 'libraries' as const,
      entityName: 'React',
      fact: 'Version 18.2.0',
      category: 'version' as const,
      timestamp: '2025-01-28',
      source: 'test',
    };
    graph.addFacts([proposal], 'test');
    const result2 = graph.addFacts([proposal], 'test');
    expect(result2.factsAdded).toBe(0);
    expect(graph.readFacts('libraries', 'react')).toHaveLength(1);
  });

  it('supersedes version facts', () => {
    graph.initialize();
    graph.addFacts([{
      entityType: 'libraries',
      entityName: 'React',
      fact: 'Version 18.2.0',
      category: 'version',
      timestamp: '2025-01-28',
      source: 'test',
    }], 'test');

    graph.addFacts([{
      entityType: 'libraries',
      entityName: 'React',
      fact: 'Version 18.3.1',
      category: 'version',
      timestamp: '2025-01-29',
      source: 'test',
    }], 'test');

    const facts = graph.readFacts('libraries', 'react');
    expect(facts).toHaveLength(2);
    expect(facts[0].status).toBe('superseded');
    expect(facts[1].status).toBe('active');
    expect(facts[1].fact).toBe('Version 18.3.1');
  });

  it('verifies valid graph', () => {
    graph.initialize();
    graph.addFacts([{
      entityType: 'projects',
      entityName: 'Test',
      fact: 'A project',
      category: 'status',
      timestamp: '2025-01-28',
      source: 'test',
    }], 'test');

    const result = graph.verify();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
