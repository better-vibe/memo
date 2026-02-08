# Memo

> **Persistent Memory for AI Agents That Actually Works**

Memo is a CLI tool that solves the #1 frustration when working with AI agents: **context loss**. Every time you start a new conversation, your AI assistant forgets critical details about your project—architecture decisions, dependencies, constraints, and patterns. Memo fixes this with a **three-layer technical knowledge graph** designed specifically for AI workflows.

---

## Why Memo Exists

If you've ever worked with AI agents, you've experienced this pain:

- **"What framework are we using again?"** — AI asks this every single session
- **"I already fixed that bug 3 conversations ago"** — But the AI doesn't remember
- **"Why did we choose this architecture?"** — Decision rationale lost to time
- **Context switching kills flow** — Stopping to explain constraints breaks momentum

Memo creates a **durable, queryable memory system** that persists between sessions, giving your AI assistant the context it needs to be truly helpful.

---

## The Three-Layer Memory System

Memo organizes knowledge into three distinct layers, each optimized for different types of information retrieval:

### Layer 1: Knowledge Graph (`/memory/graph/`)

Entity-centric, durable facts stored as atomic items. Think of it as your project's "brain"—structured, versioned, and always queryable.

```
memory/graph/
├── projects/
│   └── my-app/
│       ├── summary.md      # Current snapshot (human-readable)
│       └── items.json      # Atomic facts with full history
├── libraries/
│   └── react/
│       ├── summary.md
│       └── items.json
└── patterns/
    └── atomic-file-writes/
        ├── summary.md
        └── items.json
```

**What it stores:**
- Dependency versions and breaking changes
- Architecture decisions with rationale
- Code constraints and standards
- Known bugs and tech debt
- Project status and deployment info

**Key feature:** Facts are **immutable**. When something changes, old facts are marked "superseded" and linked to the new fact. Full decision history preserved.

### Layer 2: Technical Decisions (`DECISIONS.md`)

The "why" behind your choices. Not indexed by time—indexed by decision.

```markdown
### Why We Chose PostgreSQL Over MongoDB
- **Date**: 2024-01-20
- **Rationale**: Strong consistency for financial data; better schema validation
- **Trade-offs**: Slower for unstructured queries; vertical scaling limits
- **Status**: active
- **Related**: projects/backend, libraries/postgresql
```

### Layer 3: Agent Rules (`AGENTS.md`)

Stable operating principles your AI agent follows. How to handle code reviews, default stack preferences, deployment constraints.

**Retrieval Priority:**
1. `summary.md` — Fast, current context (default)
2. `items.json` — Deep history when needed
3. `AGENTS.md` — Agent behavior constraints
4. `DECISIONS.md` — Rationale for "why" questions

---

## Installation

### Prerequisites
- [Bun](https://bun.sh) (recommended) or Node.js 18+

### Install via npm

```bash
npm install -g @better-vibe/memo
```

### Or run directly with npx

```bash
npx @better-vibe/memo init
```

### Build from source

```bash
git clone https://github.com/better-vibe/memo.git
cd memo
bun install
bun run build
```

---

## Quick Start

### 1. Initialize Memory System

```bash
memo init
```

Creates the three-layer structure in your project:
```
memory/
├── graph/           # Knowledge graph (Layer 1)
│   ├── projects/
│   ├── libraries/
│   └── patterns/
├── _meta/           # System metadata
├── docs/            # Agent documentation
├── AGENTS.md        # Agent rules (Layer 3)
└── DECISIONS.md     # Decision log (Layer 2)
```

#### AI Agent Integration

Generate agent-specific config files so your AI tool automatically knows how to use memo:

```bash
# For Claude Code — generates CLAUDE.md
memo init --agent claude

# For Cursor — generates .cursorrules
memo init --agent cursor

# For multiple agents at once
memo init --agent claude,cursor
```

Supported agent types: `claude`, `cursor`, `codex`. After initialization, memo prints a quick-start command reference so the agent can begin working immediately.

### 2. Extract Your First Facts

```bash
# Extract from a conversation or analysis
echo '[{
  "entityType": "projects",
  "entityName": "my-app",
  "fact": "Uses React 18 with TypeScript 5.9",
  "category": "dependency",
  "timestamp": "2025-02-03",
  "source": "package.json analysis",
  "confidence": 1.0,
  "evidence": "package.json dependencies"
}]' | memo extract
```

### 3. Query Your Knowledge

```bash
# Find all dependency facts
memo query --category dependency

# Search for specific libraries
memo query --query "React"

# Get machine-readable output
memo query --entity-type projects --json
```

### 4. View Entity Details

```bash
# Inspect a specific entity
memo view projects/my-app

# See full fact history including superseded
memo view projects/my-app --full
```

### 5. Synthesize Summaries

```bash
# Rewrite summary.md from current facts
memo synthesize --entity projects/my-app

# Update all summaries
memo synthesize --all
```

---

## AI Agent Workflow: The Draft Command

**The problem:** Switching from "coding mode" to "documentation mode" breaks flow. You have insights while working but no way to queue them for later.

**The solution:** `memo draft` — accumulate facts during work, flush when convenient.

### Workflow Example

```bash
# While coding, queue insights without stopping
memo draft --add "Uses Zod for runtime validation"
memo draft --add "API rate limit: 100 requests/minute"
memo draft --add "Breaking change: dropped Node 16 support in v2.0"

# Later, extract everything at once
memo draft --flush

# Check what's queued
memo draft --list

# Clear queue if needed
memo draft --clear
```

**Smart inference:** Memo automatically detects entity types and categories from your fact text.

```bash
$ memo draft --add "React uses concurrent rendering since v18"
✅ Added to draft queue (1 total)
   Inferred: libraries/react (dependency)
```

---

## Why This Matters for AI Agents

### Before Memo
```
You: Fix the authentication bug
AI: Which auth library are you using? What's the version?
You: Auth0, v2.1.3, and we have a custom middleware
[15 minutes explaining context]
AI: Got it, let me look at the code...
```

### After Memo
```
AI: [checks memory] I see you're using Auth0 v2.1.3 with custom
    middleware. There's a known issue with that version—
    let me check the specific error pattern...
[fixes it in 30 seconds]
```

### Real Impact

| Metric | Before | After |
|--------|--------|-------|
| Context explanation time | 10-15 min/session | 0 min |
| Repeated questions | Every session | Never |
| Architecture decision loss | Common | Impossible |
| Debugging efficiency | Baseline | 3-5x faster |

### AI Agent Integration Features

- **`--agent` flag on init** — Generate `CLAUDE.md`, `.cursorrules`, or other agent config files automatically
- **Quick-start output** — After init, memo prints a command reference so agents can start immediately
- **`help-agent`** — Generate integration guides for your specific setup
- **`sync-docs`** — Keep AI agent documentation in sync with code
- **Machine-readable output** — All commands support `--json` for programmatic use
- **Atomic file operations** — Never corrupt memory during concurrent access
- **Idempotent operations** — Safe to run extraction multiple times

---

## Command Reference

| Command | Description |
|---------|-------------|
| `memo init` | Initialize memory system (use `--agent claude\|cursor\|codex` for AI config) |
| `memo context` | Load full context for AI agent session startup |
| `memo extract` | Extract facts from input (stdin, file, inline) |
| `memo synthesize` | Rewrite summaries from facts |
| `memo view <entity>` | Inspect entity and its facts |
| `memo edit <entity>` | Open entity summary in $EDITOR |
| `memo verify` | Check graph validity and contradictions |
| `memo status` | Show graph state and audit log |
| `memo query` | Query facts with filters and search |
| `memo draft` | Queue facts for later extraction |
| `memo export` | Backup graph to JSON |
| `memo import` | Restore graph from JSON backup |
| `memo help-agent` | Generate agent integration guide |
| `memo sync-docs` | Sync AI agent documentation |

### Global Options

```bash
--json          # Machine-readable JSON output
--project <path> # Project root (default: cwd)
--dry-run       # Preview changes without writing
--no-edit       # Skip prompts (batch mode)
--verbose       # Log all operations
--force         # Skip safety checks
```

---

## Fact Schema

Facts are the atomic unit of knowledge in Memo:

```typescript
{
  id: string;              // Unique identifier
  fact: string;            // The actual claim
  category: string;        // dependency|version|constraint|architecture|decision|ownership|expertise|bug|tech_debt|rule|status
  timestamp: string;       // ISO date
  source: string;          // Where this came from
  status: "active" | "superseded";
  confidence: number;      // 0.0 - 1.0
  evidence?: string;        // Supporting evidence
  supersededBy?: string;   // ID of replacement fact
  links?: Link[];          // Related entities
}
```

### Example Fact

```json
{
  "id": "proj-my-app-001",
  "fact": "Uses TypeScript 5.9 with strict mode enabled",
  "category": "dependency",
  "timestamp": "2025-02-03",
  "source": "package.json and tsconfig.json analysis",
  "status": "active",
  "confidence": 1,
  "evidence": "package.json devDependencies: typescript ^5.9.3",
  "links": [
    { "entityType": "libraries", "slug": "typescript", "relation": "uses" }
  ]
}
```

---

## Best Practices

### For Human Developers

1. **Extract after significant changes** — Dependencies, architecture, major refactors
2. **Be specific** — Version numbers, file paths, exact constraints
3. **Link related entities** — Connect projects to libraries they use
4. **Synthesize regularly** — Keep summaries current for fast AI retrieval

### For AI Agents

1. **Query before acting** — Check `memo query --related-to <entity>` for context
2. **Draft during work** — Use `memo draft --add` to capture insights without breaking flow
3. **Flush at session end** — Extract all queued facts before ending the conversation
4. **Mark superseded facts** — When something changes, link new facts to old ones

---

## Example: Complete AI Agent Session

```bash
# 1. Check existing context
$ memo query --related-to projects/my-app --json
[
  { "fact": "Uses React 18", "category": "dependency", ... },
  { "fact": "Architecture: Micro-frontends", "category": "architecture", ... }
]

# 2. Work on the code...
# [coding happens here]

# 3. Queue insights during work
$ memo draft --add "Migrated from Redux to Zustand for state management"
$ memo draft --add "Found race condition in auth middleware (see src/auth.ts:45)"
$ memo draft --add "Bundle size reduced by 40% after migration"

# 4. Flush at end of session
$ memo draft --flush
✅ Flushed 3 fact(s) to knowledge graph
   Updated entities: projects/my-app, patterns/state-management

# 5. Synthesize updated summary
$ memo synthesize --entity projects/my-app
✅ Rewrote summary for projects/my-app (3 active facts)
```

---

## Documentation

- [Three-Layer Memory System](memory/docs/three-layer-memory-system.md)
- [AI Agent Guidelines](memory/docs/agents.md)
- [Fact Schema](memory/docs/facts-item-schema.md)
- [Decision Log Format](memory/docs/decisions.md)

Generate agent-specific documentation:
```bash
memo help-agent --list-docs
memo help-agent --show-doc three-layer-memory-system
```

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © Better Vibe

---

**Stop explaining your project to AI agents. Let Memo remember for you.**

<p align="center">
  <a href="https://github.com/better-vibe/memo">GitHub</a> •
  <a href="https://www.npmjs.com/package/@better-vibe/memo">npm</a> •
  <a href="https://better-vibe.github.io/memo">Documentation</a>
</p>
