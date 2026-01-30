# Caching

## Overview

memo uses lightweight caching to improve performance and enable name resolution.

## Entity Cache

Stored in `memory/_meta/entities.json`.

### Purpose

Maps display names to URL-friendly slugs:

```json
{
  "My Project": "my-project",
  "TypeScript": "typescript",
  "Alice Smith": "alice-smith",
  "Node.js": "nodejs"
}
```

### When Updated

The cache is updated whenever an entity is created:

```typescript
// Creating "My Project" automatically updates cache
createEntity('projects', 'My Project', 'Description');
// Cache now contains: "My Project" → "my-project"
```

### Usage

When resolving entity names:

1. Slugify the name (e.g., "My Project" → "my-project")
2. Check cache for exact match first
3. Fall back to slugified version

This allows referring to entities by their original names even if the slug differs slightly.

### Manual Cache Management

Normally you don't need to manage the cache manually, but you can:

```bash
# View cache
cat memory/_meta/entities.json

# Clear cache (auto-rebuilds on next entity creation)
rm memory/_meta/entities.json
```

## Audit Log

Stored in `memory/_meta/audit.json`.

### Purpose

Immutable log of all graph operations for:
- Debugging
- Accountability
- Rollback scenarios
- Analytics

### Structure

```json
[
  {
    "timestamp": "2026-01-30T21:35:00Z",
    "operation": "extract",
    "source": "stdin",
    "entitiesAffected": ["projects/my-project"],
    "factsAdded": 3,
    "factsSuperseded": 1,
    "status": "ok"
  }
]
```

### Operations Tracked

- `extract` — Facts extracted from input
- `synthesize` — Summaries rewritten
- `import` — Data imported from backup
- `verify` — Graph verification run

### Viewing

```bash
# View full audit log
memo status --audit

# View as JSON
memo status --audit --json

# View raw file
cat memory/_meta/audit.json | jq
```

### Retention

The audit log grows indefinitely. To manage size:

```bash
# Archive old entries
head -100 memory/_meta/audit.json > audit-archive-2025.json
tail -50 memory/_meta/audit.json > audit-recent.json
mv audit-recent.json memory/_meta/audit.json
```

## File System Caching

### Atomic Writes

All file writes are atomic:

1. Write to temporary file
2. Rename to target (atomic operation)

Benefits:
- No partial/corrupted files
- Safe for concurrent access
- Version control friendly

### Temp File Naming

Pattern: `.tmp-{pid}-{timestamp}-{random}`

Example: `.tmp-12345-1706654100000-a3f2b1c8`

### Cleanup

Failed writes automatically clean up temp files. To manually clean:

```bash
# Remove all temp files
find memory -name ".tmp-*" -delete
```

## Performance Considerations

### What is NOT Cached

- Fact data (always read from disk)
- Summaries (always read from disk)
- Search indexes (full scan on search)

### Why?

- Simplicity — No cache invalidation complexity
- Durability — Always see current state
- VC-friendly — Works well with git

### Optimization Opportunities

For large graphs, consider:

1. **Indexing** — Build search index periodically
2. **Lazy loading** — Load facts on demand
3. **Compression** — Compress old audit entries

## Next Steps

- [Core Engine](../05-core) — Implementation details
- [Development](../10-development) — Testing and optimization
