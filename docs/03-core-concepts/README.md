# Core Concepts

## Fact

The atomic unit of knowledge in memo.

### Structure

```typescript
interface FactItem {
  id: string;                    // Unique identifier (e.g., "prj-myproject-001")
  fact: string;                  // The fact content (human-readable)
  category: FactCategory;        // Classification
  timestamp: string;             // ISO date (YYYY-MM-DD)
  source: string;                // Origin of the information
  status: 'active' | 'superseded'; // Current status
  supersededBy?: string;         // ID of fact that replaced this (if superseded)
  confidence?: number;           // 0-1 confidence score
  evidence?: string;             // Supporting evidence
  tags?: string[];               // Optional tags
  expiresAt?: string;            // Optional expiration date
}
```

### Categories

Facts are classified into categories:

| Category | Description | Example |
|----------|-------------|---------|
| `dependency` | Project dependencies | "Uses TypeScript 5.9" |
| `version` | Version constraints | "Requires Node.js >= 18" |
| `constraint` | Technical constraints | "Must support IE11" |
| `architecture` | Architecture decisions | "Uses microservices" |
| `decision` | General decisions | "Chose PostgreSQL over MySQL" |
| `ownership` | Code ownership | "Auth module owned by team" |
| `bug` | Known bugs | "Issue #123 causes crashes" |
| `tech_debt` | Technical debt | "Needs refactoring" |
| `rule` | Project rules | "Always use strict mode" |
| `status` | Current status | "In production" |

## Entity

A named object that facts can be attached to.

### Types

| Type | Description | Example Slug |
|------|-------------|--------------|
| `projects` | Software projects | `my-web-app` |
| `libraries` | Dependencies | `typescript` |
| `patterns` | Reusable patterns | `repository-pattern` |

### Storage

Each entity is a directory with two files:
- `summary.md` — Current state (rewritten from facts)
- `items.json` — All facts (active and superseded)

## Contradiction Handling

Facts are **immutable** — they are never deleted, only superseded.

### When Facts Conflict

```
Old fact: "Uses React 17"
New fact: "Uses React 18"
```

Result:
1. New fact added with `status: 'active'`
2. Old fact marked `status: 'superseded'`
3. Old fact gets `supersededBy: '<new-fact-id>'`

### Why?

- **History preservation** — See how knowledge evolved
- **Audit trail** — Track what changed and when
- **Confidence** — Old facts may still be relevant

## Slugification

Entity names are converted to URL-friendly slugs:

```javascript
slugify("My Project")      // "my-project"
slugify("Node.js")         // "nodejs"
slugify("  TypeScript  ")  // "typescript"
```

Rules:
- Lowercase
- Trim whitespace
- Spaces/underscores → hyphens
- Remove special characters
- Collapse multiple hyphens
- Remove leading/trailing hyphens

## Confidence Scores

Optional 0-1 score indicating certainty:

| Score | Meaning |
|-------|---------|
| 1.0 | Certain (from source of truth) |
| 0.8 | High confidence (verified) |
| 0.5 | Moderate (hearsay, unverified) |
| 0.2 | Low (guess, temporary) |

## Active vs Superseded

### Active Facts

- Current, valid information
- Used for summary generation
- Returned by default in queries

### Superseded Facts

- Outdated, replaced information
- Preserved for history
- Accessible with `--full` flag

## Extraction Proposals

When extracting facts from input, the system generates proposals:

```typescript
interface ExtractionProposal {
  entityType: 'projects' | 'libraries' | 'patterns';
  entityName: string;
  fact: string;
  category: FactCategory;
  timestamp: string;
  source: string;
  confidence?: number;
  evidence?: string;
}
```

Proposals are validated against the schema before being added to the graph.

## Next Steps

- [Entity Types](../04-entity-types) — Projects, libraries, patterns
- [Core Engine](../05-core) — Implementation details
