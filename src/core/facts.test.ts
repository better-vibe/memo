import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { readFacts, writeFacts, generateId, entityTypeAbbr, isDuplicate, findContradictions, supersedeFact, getActiveFacts } from './facts';
import { FactItem } from './validation';

describe('facts', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const makeFact = (overrides: Partial<FactItem> = {}): FactItem => ({
    id: 'proj-test-001',
    fact: 'Test fact',
    category: 'dependency',
    timestamp: '2025-01-28',
    source: 'test',
    status: 'active',
    ...overrides,
  });

  describe('readFacts / writeFacts', () => {
    it('reads empty array from nonexistent file', () => {
      expect(readFacts(path.join(tmpDir, 'nope.json'))).toEqual([]);
    });

    it('round-trips facts', () => {
      const file = path.join(tmpDir, 'items.json');
      const facts = [makeFact()];
      writeFacts(file, facts);
      expect(readFacts(file)).toEqual(facts);
    });
  });

  describe('generateId', () => {
    it('generates first id', () => {
      expect(generateId('proj', 'api', [])).toBe('proj-api-001');
    });

    it('increments from existing', () => {
      const existing = [makeFact({ id: 'proj-api-003' })];
      expect(generateId('proj', 'api', existing)).toBe('proj-api-004');
    });
  });

  describe('entityTypeAbbr', () => {
    it('maps known types', () => {
      expect(entityTypeAbbr('projects')).toBe('proj');
      expect(entityTypeAbbr('libraries')).toBe('lib');
      expect(entityTypeAbbr('patterns')).toBe('pat');
    });
  });

  describe('isDuplicate', () => {
    it('detects exact duplicates', () => {
      const facts = [makeFact({ fact: 'React 18.2.0' })];
      expect(isDuplicate(facts, 'React 18.2.0')).toBe(true);
      expect(isDuplicate(facts, 'react 18.2.0')).toBe(true);
    });

    it('ignores superseded', () => {
      const facts = [makeFact({ fact: 'React 18.2.0', status: 'superseded' })];
      expect(isDuplicate(facts, 'React 18.2.0')).toBe(false);
    });
  });

  describe('findContradictions', () => {
    it('finds version contradictions', () => {
      const facts = [makeFact({ category: 'version' })];
      expect(findContradictions(facts, 'version', 'new version')).toHaveLength(1);
    });

    it('ignores non-version categories', () => {
      const facts = [makeFact({ category: 'architecture' })];
      expect(findContradictions(facts, 'architecture', 'new arch')).toHaveLength(0);
    });
  });

  describe('supersedeFact', () => {
    it('marks fact as superseded', () => {
      const facts = [makeFact({ id: 'a' }), makeFact({ id: 'b' })];
      const result = supersedeFact(facts, 'a', 'c');
      expect(result[0].status).toBe('superseded');
      expect(result[0].supersededBy).toBe('c');
      expect(result[1].status).toBe('active');
    });
  });

  describe('getActiveFacts', () => {
    it('filters active only', () => {
      const facts = [makeFact({ status: 'active' }), makeFact({ id: 'x', status: 'superseded' })];
      expect(getActiveFacts(facts)).toHaveLength(1);
    });
  });
});
