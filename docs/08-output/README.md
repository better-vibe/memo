# Output Formats

## JSON Output

All commands support `--json` flag for machine-readable output.

### init

```json
{
  "status": "ok",
  "message": "Memory graph initialized",
  "paths": {
    "graph": "/project/memory/graph",
    "agents": "/project/AGENTS.md",
    "decisions": "/project/DECISIONS.md",
    "meta": "/project/memory/_meta"
  }
}
```

### extract

```json
{
  "status": "ok",
  "factsAdded": 3,
  "factsSuperseded": 1,
  "entitiesUpdated": [
    "projects/my-project",
    "libraries/typescript"
  ]
}
```

### view

```json
{
  "entity": {
    "type": "projects",
    "slug": "my-project"
  },
  "summary": "# My Project\n\n...",
  "facts": [
    {
      "id": "prj-myproject-001",
      "fact": "Uses TypeScript 5.9",
      "category": "dependency",
      "timestamp": "2026-01-30",
      "source": "package.json",
      "status": "active"
    }
  ],
  "activeFacts": 5,
  "supersededFacts": 1
}
```

### search

```json
{
  "query": "TypeScript",
  "results": [
    {
      "entity": "projects/my-project",
      "fact": {
        "id": "prj-myproject-001",
        "fact": "Uses TypeScript 5.9",
        "category": "dependency",
        "status": "active"
      }
    },
    {
      "entity": "developers/alice",
      "fact": {
        "id": "dev-alice-003",
        "fact": "Expert in TypeScript",
        "category": "expertise",
        "status": "active"
      }
    }
  ],
  "total": 2
}
```

### verify

```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    "projects/my-project: missing summary.md"
  ],
  "stats": {
    "entities": 12,
    "facts": 45,
    "activeFacts": 42,
    "supersededFacts": 3
  }
}
```

### status

```json
{
  "initialized": true,
  "entities": {
    "total": 12,
    "byType": {
      "projects": 3,
      "developers": 4,
      "libraries": 3,
      "patterns": 2
    }
  },
  "facts": {
    "total": 45,
    "active": 42,
    "superseded": 3
  },
  "lastOperation": "2026-01-30T21:35:00Z"
}
```

### export

Full graph export:

```json
{
  "exportDate": "2026-01-30T21:35:00Z",
  "version": "0.1.0",
  "entities": [
    {
      "type": "projects",
      "slug": "my-project",
      "summary": "# My Project...",
      "facts": [
        {
          "id": "prj-myproject-001",
          "fact": "Uses TypeScript 5.9",
          "category": "dependency",
          "timestamp": "2026-01-30",
          "source": "package.json",
          "status": "active"
        }
      ]
    }
  ],
  "audit": [
    {
      "timestamp": "2026-01-30T21:35:00Z",
      "operation": "extract",
      "source": "stdin",
      "entitiesAffected": ["projects/my-project"],
      "factsAdded": 3,
      "status": "ok"
    }
  ]
}
```

## File Formats

### items.json

Array of fact objects:

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
  },
  {
    "id": "prj-myproject-002",
    "fact": "Uses TypeScript 5.8",
    "category": "dependency",
    "timestamp": "2025-12-01",
    "source": "package.json",
    "status": "superseded",
    "supersededBy": "prj-myproject-001"
  }
]
```

Schema: `FactItemsArraySchema` (see [validation.ts](../../src/core/validation.ts))

### summary.md

Markdown format:

```markdown
# Display Name

Description or overview paragraph.

## Dependencies
- Uses TypeScript 5.9
- Uses React 18

## Architecture
- Built with microservices pattern
- Uses PostgreSQL for persistence

Last updated: 2026-01-30
```

### audit.json

Array of audit entries:

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
  },
  {
    "timestamp": "2026-01-30T21:30:00Z",
    "operation": "synthesize",
    "source": "memo synthesize --all",
    "entitiesAffected": ["projects/my-project", "developers/alice"],
    "factsAdded": 0,
    "status": "ok"
  }
]
```

### entities.json

Name-to-slug cache:

```json
{
  "My Project": "my-project",
  "TypeScript": "typescript",
  "Alice Smith": "alice-smith"
}
```

## ID Format

Fact IDs follow a pattern:

```
{type-abbr}-{slug}-{sequence}
```

Examples:
- `prj-myproject-001` (project)
- `dev-alice-003` (developer)
- `lib-typescript-001` (library)
- `pat-repository-001` (pattern)

Abbreviations:
- `prj` — projects
- `dev` — developers
- `lib` — libraries
- `pat` — patterns

## Category Values

Valid fact categories:

- `dependency` — Project dependencies
- `version` — Version information
- `constraint` — Technical constraints
- `architecture` — Architecture decisions
- `decision` — General decisions
- `ownership` — Code ownership
- `expertise` — Developer expertise
- `bug` — Known bugs
- `tech_debt` — Technical debt
- `rule` — Coding rules
- `status` — Project status

## Next Steps

- [Caching](../09-caching) — How caching works
- [Core Engine](../05-core) — Data flow details
