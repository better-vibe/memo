# Product Overview

## What is memo?

`memo` is a CLI tool that implements a **three-layer technical knowledge graph memory system** for software projects. It provides persistent, structured storage of facts about your codebase that both humans and AI agents can read and write.

## Why memo?

Software projects accumulate knowledge that often gets lost:
- Architecture decisions buried in closed PRs
- Developer expertise scattered across chat messages
- Library versions and constraints undocumented
- Patterns discovered but never formalized

`memo` solves this by providing a **durable, queryable memory layer** that lives alongside your code.

## Key Features

### Structured Knowledge Storage

Facts are stored atomically with metadata:
- **Category**: dependency, version, constraint, architecture, decision, etc.
- **Timestamp**: When the fact was recorded
- **Source**: Origin of the information
- **Status**: Active or superseded
- **Confidence**: Optional confidence score (0-1)

### Three Entity Types

Organize knowledge around:
- **Projects** — Software projects and repositories
- **Libraries** — Dependencies and their versions/constraints
- **Patterns** — Reusable patterns and best practices

### Contradiction Handling

Facts are never deleted. When new information contradicts old:
1. New fact added as `active`
2. Old fact marked `superseded`
3. Linked via `supersededBy` field

This preserves history and enables auditing.

### Tiered Retrieval

Access knowledge in order of relevance:
1. `summary.md` — Human-readable current state
2. `items.json` — All facts (for verification/history)
3. `AGENTS.md` — Stable rules and constraints
4. `DECISIONS.md` — Decision rationale

### Fuzzy Deduplication

Near-duplicate facts are detected via Jaccard word-level similarity. When an agent phrases the same fact slightly differently across sessions (e.g., "Uses React 18" vs "Uses React v18"), the system prevents redundant entries at a configurable similarity threshold (default 85%).

### Fact Expiration

Facts can optionally include an `expiresAt` date. The `verify` command warns about active facts past their expiration, and `query --exclude-expired` filters them out. The `context` command automatically excludes expired facts.

### Tag-Based Filtering

Facts support optional `tags` arrays (e.g., `["blocking", "security"]`). The `query --tag` flag filters facts by tag with AND logic across multiple tags.

### Draft Queue

AI agents can quickly capture facts during coding without context switching:
- `memo draft --add "fact"` — Queue a fact
- `memo draft --flush` — Extract all queued drafts to the graph
- Auto-infers entity type, name, and category from text

### AI Context Loading

The `memo context` command generates a compact, AI-optimized context dump:
- Ranked facts (highest confidence and most recent first)
- Expired facts automatically excluded
- Category breakdown and graph statistics
- Optional inclusion of DECISIONS.md and AGENTS.md

### Relationship Linking

Facts can contain links to other entities. Links are:
- Auto-detected from fact text (e.g., "Uses React" creates a link)
- Bidirectional (A uses B automatically creates B used_by A)
- Queryable via `memo query --related-to`

### AI Agent Friendly

Designed for programmatic access:
- JSON output format (`--json`)
- Machine-readable structures
- Atomic file operations
- Idempotent updates

## Use Cases

### For AI Coding Agents

- Maintain context across sessions
- Store discovered patterns and constraints
- Track architecture decisions
- Remember project-specific rules

### For Development Teams

- Document dependencies and versions
- Track expertise and ownership
- Record architecture decisions (ADRs)
- Build searchable knowledge bases

### For Code Review

- Verify constraints before changes
- Check for contradictions
- Review audit logs

## Design Principles

1. **Durability over convenience** — Never lose information
2. **Atomic operations** — All writes are atomic (temp + rename)
3. **Version control friendly** — Text-based formats
4. **Small composable writes** — Prefer granularity
5. **Idempotent** — Same operation produces same result

## Comparison

| Tool | Purpose | Format | AI-friendly |
|------|---------|--------|-------------|
| memo | Knowledge graph | JSON + Markdown | Yes |
| ADR | Decision records | Markdown | Partial |
| Wiki | Documentation | Various | No |
| Comments | Inline docs | Code comments | No |

## Next Steps

- [Architecture](../02-architecture) — Learn the three-layer system
- [CLI Reference](../06-cli) — Command documentation
