# memo

A CLI for three-layer technical knowledge graph memory system.

## Overview

`memo` is a command-line tool that helps AI agents and developers maintain persistent, structured knowledge about software projects. It implements a three-layer memory architecture:

1. **Knowledge Graph** — Structured facts about entities (projects, libraries, patterns)
2. **AGENTS.md** — Stable rules and constraints
3. **DECISIONS.md** — Decision rationale and trade-offs

## Quick Start

```bash
# Install globally
npm install -g @better-vibe/memo

# Or use with npx
npx @better-vibe/memo init

# Initialize memory system in your project
memo init

# Initialize with AI agent config (Claude Code, Cursor, etc.)
memo init --agent claude

# Extract facts from stdin
echo '[{"entityType":"projects","entityName":"My App","fact":"Uses TypeScript 5.9","category":"dependency","timestamp":"2026-02-07","source":"manual"}]' | memo extract

# View an entity
memo view projects/my-app

# Query across all facts
memo query --query "TypeScript"

# Load full context for AI agent session startup
memo context --compact

# Queue facts during coding, flush later
memo draft --add "Uses Zod 3.22 for validation"
memo draft --flush
```

## Key Features

- **Atomic fact storage** — Facts stored with timestamps, sources, and categories
- **Contradiction handling** — Old facts marked superseded, never deleted
- **Fuzzy deduplication** — Near-duplicate facts detected via Jaccard similarity
- **Fact expiration** — Optional `expiresAt` field with enforcement in verify and query
- **Tag-based filtering** — Tag facts and query by tags
- **AI context loading** — `memo context` generates a compact, ranked context dump
- **Draft queue** — Capture facts quickly, extract in batch later
- **Tiered retrieval** — Summary → Facts → Rules → Decisions
- **Relationship linking** — Auto-detected bidirectional links between entities
- **Version control friendly** — JSON facts, Markdown summaries
- **AI agent config generation** — `--agent claude|cursor|codex` generates config files for AI tools
- **AI agent integration** — Structured for programmatic access with `--json` output

## Documentation

- [01-product](./docs/01-product) — Product overview and features
- [02-architecture](./docs/02-architecture) — System architecture
- [03-core-concepts](./docs/03-core-concepts) — Core concepts and data model
- [04-entity-types](./docs/04-entity-types) — Entity types (projects, libraries, patterns)
- [05-core](./docs/05-core) — Core engine internals
- [06-cli](./docs/06-cli) — CLI commands reference
- [07-configuration](./docs/07-configuration) — Configuration and setup
- [08-output](./docs/08-output) — Output formats and structures
- [09-caching](./docs/09-caching) — Caching and meta storage
- [10-development](./docs/10-development) — Development guide

## License

MIT © Better Vibe
