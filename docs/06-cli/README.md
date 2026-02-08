# CLI Reference

## Global Options

All commands support these options:

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Machine-readable JSON output | `false` |
| `--project <path>` | Project root directory | `process.cwd()` |
| `--dry-run` | Preview changes without writing | `false` |
| `--no-edit` | Skip prompts (batch mode) | - |
| `--verbose` | Log all operations | `false` |
| `--force` | Skip safety checks | `false` |

## Commands

### `init`

Initialize the three-layer memory system.

```bash
memo init [options]
```

Creates:
- `memory/graph/` with entity type directories
- `memory/_meta/` for audit logs
- `memory/docs/` with AI agent documentation
- `AGENTS.md` (if not exists)
- `DECISIONS.md` (if not exists)

When `--agent` is provided, also generates agent-specific config files (e.g., `CLAUDE.md`, `.cursorrules`) containing memo integration instructions so the AI tool automatically knows how to use the knowledge graph.

After initialization, prints a quick-start command reference so the agent can begin using memo immediately.

**Options:**
- `--agent <types>` — Generate AI agent config files (comma-separated). Supported types:
  - `claude` — Generates `CLAUDE.md` with memo workflow instructions
  - `cursor` — Generates `.cursorrules` with memo workflow instructions
  - `codex` — Uses the default `AGENTS.md` (always created)
- `--force` — Reinitialize even if already initialized

**Idempotent behavior:** If the target file already exists, memo appends a memo section instead of overwriting. Use `--force` to overwrite.

**Examples:**
```bash
memo init                        # Basic initialization
memo init --agent claude         # With Claude Code integration
memo init --agent cursor         # With Cursor integration
memo init --agent claude,cursor  # Multiple agents at once
memo init --force --agent claude # Reinitialize + overwrite CLAUDE.md
```

**Output:**
```
✅ Memory graph initialized
   Graph:     /project/memory/graph
   Agents:    /project/AGENTS.md
   Decisions: /project/DECISIONS.md
   Meta:      /project/memory/_meta
   Docs:      /project/memory/docs (8 files)
   Agent configs generated: CLAUDE.md

--- Quick Start ---

COMMANDS:
  memo context --compact       Load session context (run at conversation start)
  memo draft --add "<fact>"    Queue a fact during work
  memo draft --flush           Extract all queued drafts to knowledge graph
  ...
```

---

### `extract`

Extract facts from input and add to the graph.

```bash
memo extract [options]
```

Reads from `stdin` by default, or use `--data` for inline input.

**Options:**
- `--source <source>` — Input source: `stdin`, file path, or `inline`
- `--data <data>` — Inline data (alternative to piping)

**Examples:**
```bash
# From stdin
echo "Project uses TypeScript" | memo extract

# From file
memo extract --source conversation.md

# Inline
memo extract --data "Project uses React"

# Dry run (preview only)
echo "New fact" | memo extract --dry-run
```

**Output:**
```
✅ Extracted 3 facts
   Added: 2 new facts
   Superseded: 1 outdated fact
```

---

### `synthesize`

Rewrite entity summaries from active facts.

```bash
memo synthesize [options]
```

**Options:**
- `--all` — Synthesize all entities
- `--entity <path>` — Synthesize specific entity (format: `type/slug`)

**Examples:**
```bash
# Synthesize all
memo synthesize --all

# Synthesize one entity
memo synthesize --entity projects/my-project
```

---

### `view`

Inspect an entity and its facts.

```bash
memo view <entity> [options]
```

**Arguments:**
- `<entity>` — Entity path (format: `type/slug`)

**Options:**
- `--full` — Show all facts including superseded

**Examples:**
```bash
# View project
memo view projects/my-project

# Include superseded facts
memo view projects/my-project --full

# JSON output
memo view projects/my-project --json
```

**Output:**
```
# My Project

## Dependencies
- Uses TypeScript 5.9
- Uses React 18

Last updated: 2026-01-30
```

---

### `query`

Query facts with advanced filtering and search.

```bash
memo query [options]
```

**Options:**
- `--entity-type <type>` — Filter by entity type (projects, libraries, patterns)
- `--category <cat>` — Filter by category
- `--status <status>` — Filter by status (active, superseded)
- `--source <pattern>` — Filter by source (regex)
- `--query <text>` — Search fact text (regex)
- `--evidence-contains <text>` — Search evidence field (regex)
- `--tag <tags>` — Filter by tags (comma-separated, AND logic)
- `--exclude-expired` — Exclude facts past their `expiresAt` date
- `--related-to <entity>` — Find facts from entities linked to target
- `--where <clause>` — Compound clause (e.g., `confidence>0.8`). Repeatable.

**Examples:**
```bash
# Simple text search
memo query --query "TypeScript"

# Filter by category
memo query --category dependency

# High-confidence facts with evidence
memo query --where "confidence>0.9" --evidence-contains "package.json"

# Find facts related to a specific entity
memo query --related-to projects/my-app

# Filter by tags
memo query --tag "blocking,security"

# Exclude expired facts
memo query --exclude-expired --status active

# Combined filters with JSON output
memo query --category dependency --where "confidence>=0.8" --json
```

**Output:**
```
Found 3 fact(s) matching: category=dependency

libraries/react:
  [lib-react-001] Uses React 18 for frontend UI
    Evidence: package.json

libraries/typescript:
  [lib-typescript-001] TypeScript 5.9 for type checking
  [lib-typescript-002] Strict mode enabled
```

---

### `edit`

Open entity summary in `$EDITOR`.

```bash
memo edit <entity> [options]
```

**Arguments:**
- `<entity>` — Entity path (format: `type/slug`)

**Examples:**
```bash
memo edit projects/my-project
memo edit patterns/repository-pattern
```

Opens `summary.md` in your default editor (respects `$EDITOR` environment variable).

---

### `verify`

Check graph validity and contradictions.

```bash
memo verify [options]
```

**Examples:**
```bash
memo verify
memo verify --json
```

**Output:**
```
✅ Graph valid
   Entities: 12
   Facts: 45
   Warnings: 0
```

Or if issues:
```
❌ Graph has errors
   projects/my-project: duplicate fact IDs: prj-myproject-001
   libraries/react: invalid items.json

Warnings:
   projects/my-app: fact proj-my-app-003 expired on 2026-01-15 but still active
   libraries/react: potential duplicate facts (87% similar): lib-react-001 and lib-react-003
```

---

### `status`

Show graph state and audit log.

```bash
memo status [options]
```

**Options:**
- `--audit` — Show audit log
- `--detailed` — Show category breakdown, entity types, and link statistics

**Examples:**
```bash
# Basic status
memo status

# With detailed breakdown
memo status --detailed

# With audit log
memo status --audit

# JSON output
memo status --json
```

**Output:**
```
Memory Graph Status
  Entities:         8
  Total facts:      45
  Active facts:     42
  Superseded facts: 3
```

With `--detailed`:
```
Memory Graph Status
  Entities:         8
  Total facts:      45
  Active facts:     42
  Superseded facts: 3
  Expired facts:    2 (active but past expiresAt)

Entity types:
  projects: 3
  libraries: 3
  patterns: 2

Fact categories (active):
  dependency: 15
  version: 8
  architecture: 7
  status: 5
  constraint: 4
  rule: 3

Relationships:
  Total links: 12
  Entities with links: 5/8
  uses: 8
  used_by: 4
```

---

### `export`

Backup graph to JSON.

```bash
memo export [options]
```

**Options:**
- `--output <path>` — Output file path (default: `memo-export.json`)

**Examples:**
```bash
memo export
memo export --output backup-2026-01.json
memo export --output -  # stdout
```

---

### `import`

Restore graph from JSON backup.

```bash
memo import [options]
```

**Options:**
- `--input <path>` — Input file path (default: `-` for stdin)

**Examples:**
```bash
# From file
memo import --input backup-2026-01.json

# From stdin
cat backup.json | memo import
```

⚠️ **Warning:** Import overwrites existing data. Use with caution.

---

### `help-agent`

Generate agent integration guide.

```bash
memo help-agent [options]
```

**Options:**
- `--list-docs` — List available documentation files
- `--show-doc <name>` — Show specific documentation file

**Examples:**
```bash
# Show full agent integration guide
memo help-agent

# List available docs
memo help-agent --list-docs

# Show specific doc
memo help-agent --show-doc extract
```

---

### `sync-docs`

Sync AI agent documentation to `memory/docs/`.

```bash
memo sync-docs [options]
```

Copies embedded prompt files (extraction format, schema docs, agent rules) into the project's `memory/docs/` directory so AI agents have all documentation within the project context.

**Examples:**
```bash
memo sync-docs
```

---

### `draft`

Queue facts for later extraction (AI agent workflow).

```bash
memo draft [options]
```

**Options:**
- `--add <fact>` — Add a fact to the draft queue
- `--list` — List all queued drafts
- `--flush` — Extract all queued drafts to the knowledge graph
- `--clear` — Clear the draft queue without extracting

**Examples:**
```bash
# Queue facts during coding
memo draft --add "Uses Zod 3.22 for validation"
memo draft --add "Implements atomic file write pattern"

# Review queued drafts
memo draft --list

# Flush all to knowledge graph
memo draft --flush

# Discard queue
memo draft --clear
```

**Output (--add):**
```
Added to draft queue (2 total)
   Inferred: libraries/Zod (dependency)
```

**Output (--flush):**
```
Flushed 2 fact(s) to knowledge graph
   1 fact(s) superseded
   Updated entities: libraries/zod, patterns/atomic-writes
```

---

### `context`

Generate AI-optimized context dump for session startup.

```bash
memo context [options]
```

Produces a compact, structured overview of the knowledge graph for an AI agent to quickly bootstrap understanding of a project.

**Options:**
- `--entity-type <type>` — Filter to specific entity type
- `--entity <path>` — Focus on a specific entity (type/slug)
- `--max-facts <n>` — Maximum facts per entity
- `--compact` — Compact output (one line per fact)
- `--include-decisions` — Include DECISIONS.md content
- `--include-agents` — Include AGENTS.md content

**Examples:**
```bash
# Full context dump
memo context

# Compact view
memo context --compact

# Focus on a specific entity
memo context --entity projects/my-app

# Include decisions and agent rules
memo context --include-decisions --include-agents

# Limit facts per entity, JSON output
memo context --max-facts 5 --json
```

**Output:**
```
=== Knowledge Graph Context ===
Generated: 2026-02-07T12:00:00.000Z
Entities: 8 | Active facts: 42
Categories: dependency(15), version(8), architecture(7), status(5)

--- projects/my-app (My App) ---
  dependency:
    - Uses TypeScript 5.9 [100%]
    - Uses React 18 for frontend [90%]
  architecture:
    - Microservices with API gateway [80%]
  links: uses → libraries/typescript, uses → libraries/react

--- libraries/typescript (Typescript) ---
  version:
    - Current version: 5.9.3 [100%]
```

**JSON output** includes `graphStats`, `entities` with ranked facts, and optionally `decisions` and `agents` content.

---

### `help`

Show help information.

```bash
memo help [command]
```

**Examples:**
```bash
# Full help
memo help

# Help for a specific command
memo help extract
memo help query
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error |
| `2` | Validation error |
| `3` | Already initialized (init with no --force) |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `$EDITOR` | Default editor for `edit` command |
| `MEMO_NO_EDIT` | Set to `1` to skip prompts (set by `--no-edit`) |
| `MEMO_FORCE` | Set to `1` to skip safety checks (set by `--force`) |
| `MEMO_VERBOSE` | Set to `1` for verbose logging (set by `--verbose`) |

## Examples

### Daily Workflow

```bash
# Initialize project (with AI agent config)
memo init --agent claude

# Load context at session start
memo context --compact

# Queue facts during coding
memo draft --add "Migrated auth module to JWT"
memo draft --add "Uses bcrypt for password hashing"

# Flush drafts to graph
memo draft --flush

# Synthesize updated summaries
memo synthesize --all

# Verify everything is valid
memo verify

# Check detailed status
memo status --detailed
```

### CI/CD Integration

```bash
# Verify graph in CI
memo verify --json || exit 1

# Export before deployment
memo export --output backup-$(date +%Y%m%d).json
```

## Next Steps

- [Configuration](../07-configuration) — Project setup
- [Output Formats](../08-output) — JSON structures
