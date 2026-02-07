# Architecture

## Three-Layer Memory System

```
┌─────────────────────────────────────────────────────────────┐
│                     PROJECT ROOT                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Knowledge Graph (~/memory/graph/)                 │
│  ┌─────────────┐ ┌─────────────┐                           │
│  │ projects/   │ │  libraries/ │                           │
│  │ • summary   │ │ • summary   │                           │
│  │ • items     │ │ • items     │                           │
│  └─────────────┘ └─────────────┘                           │
│  ┌─────────────┐                                            │
│  │ patterns/   │                                            │
│  │ • summary   │                                            │
│  │ • items     │                                            │
│  └─────────────┘                                            │
│                                                             │
│  Layer 2: AGENTS.md — Stable rules and constraints         │
│  Layer 3: DECISIONS.md — Decision rationale                │
│                                                             │
│  Meta: ~/memory/_meta/                                      │
│  • audit.json — Operation log                               │
│  • entities.json — Name-to-slug cache                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Layer 1: Knowledge Graph

The knowledge graph stores **atomic facts** about three entity types: projects, libraries, and patterns.

### Entity Structure

Each entity lives in a directory:
```
memory/graph/{entity-type}/{entity-slug}/
├── summary.md     # Human-readable summary
└── items.json     # Atomic facts (JSON array)
```

### Storage Format

**summary.md**
```markdown
# Project Name

Description goes here.

Last updated: 2026-01-30
```

**items.json**
```json
[
  {
    "id": "prj-myproject-001",
    "fact": "Uses TypeScript 5.9",
    "category": "dependency",
    "timestamp": "2026-01-30",
    "source": "package.json",
    "status": "active",
    "confidence": 1.0
  }
]
```

## Layer 2: AGENTS.md

Contains **stable rules and constraints** that don't change often:
- Writing discipline guidelines
- What to remember vs skip
- Conflict handling procedures
- Tiered retrieval order

This file is created by `memo init` with sensible defaults.

## Layer 3: DECISIONS.md

Contains **architecture decision records (ADRs)**:
- Decision title and date
- Rationale and trade-offs
- Status (active, superseded, under_review)
- Links to related facts in knowledge graph

## Meta Storage

The `_meta/` directory contains operational data:

**audit.json** — Immutable log of all operations:
```json
[
  {
    "timestamp": "2026-01-30T21:35:00Z",
    "operation": "extract",
    "source": "stdin",
    "entitiesAffected": ["projects/myproject"],
    "factsAdded": 3,
    "factsSuperseded": 1,
    "status": "ok"
  }
]
```

**entities.json** — Cache for name-to-slug resolution:
```json
{
  "My Project": "my-project",
  "TypeScript": "typescript"
}
```

**draft.json** — Draft queue for AI agent workflow (optional):
```json
{
  "items": [
    { "id": "draft-...", "fact": "Uses Zod 3.22", "timestamp": "...", "inferred": { ... } }
  ],
  "lastUpdated": "..."
}
```

## Retrieval Order

When an AI agent needs context, it should read in this order:

1. **summary.md** — Default context window (current state)
2. **items.json** — Load for history, rationale, verification
3. **AGENTS.md** — Stable rules (rarely changes)
4. **DECISIONS.md** — Decision context (as needed)

## File Operations

All writes are **atomic** (write temp file, then rename):
```
1. Write to .tmp-{pid}-{time}-{random}
2. Rename to target file
3. On error: clean up temp file
```

This ensures:
- No partial writes
- Safe concurrent access
- Version control consistency

## Next Steps

- [Core Concepts](../03-core-concepts) — Facts, entities, contradictions
- [Core Engine](../05-core) — Implementation details
