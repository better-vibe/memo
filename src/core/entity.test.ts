import { describe, it, expect } from 'bun:test';
import { slugify } from './entity';

describe('slugify', () => {
  it('lowercases and trims', () => {
    expect(slugify('  React  ')).toBe('react');
  });

  it('replaces spaces with dashes', () => {
    expect(slugify('API Backend')).toBe('api-backend');
  });

  it('replaces underscores with dashes', () => {
    expect(slugify('my_project')).toBe('my-project');
  });

  it('removes special characters', () => {
    expect(slugify('PostgreSQL Database!')).toBe('postgresql-database');
  });

  it('collapses multiple dashes', () => {
    expect(slugify('foo--bar---baz')).toBe('foo-bar-baz');
  });

  it('trims leading/trailing dashes', () => {
    expect(slugify('-hello-')).toBe('hello');
  });

  it('handles names with dots and @', () => {
    expect(slugify('@better-vibe/memo')).toBe('better-vibememo');
  });
});
