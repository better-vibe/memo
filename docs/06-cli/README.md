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
- `AGENTS.md` (if not exists)
- `DECISIONS.md` (if not exists)

**Options:**
- `--force` — Reinitialize even if already initialized

**Examples:**
```bash
memo init
memo init --force
```

**Output:**
```
✅ Memory graph initialized
   Graph:     /project/memory/graph
   Agents:    /project/AGENTS.md
   Decisions: /project/DECISIONS.md
   Meta:      /project/memory/_meta
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
memo extract --data "Developer Alice knows Rust"

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
memo synthesize --entity developers/alice
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

# View developer
memo view developers/alice

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

### `search`

Query facts across the entire graph.

```bash
memo search <query> [options]
```

**Arguments:**
- `<query>` — Search term

**Options:**
- `--category <cat>` — Filter by category
- `--entity-type <type>` — Filter by entity type

**Examples:**
```bash
# Simple search
memo search "TypeScript"

# Filter by category
memo search "React" --category dependency

# Filter by entity type
memo search "constraint" --entity-type projects

# Combined filters
memo search "version" --category version --entity-type libraries

# JSON output
memo search "bug" --json
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

Or if errors:
```
❌ Graph has errors
   projects/my-project: duplicate fact IDs: prj-myproject-001
   libraries/react: invalid items.json
```

---

### `status`

Show graph state and audit log.

```bash
memo status [options]
```

**Options:**
- `--audit` — Show audit log

**Examples:**
```bash
# Basic status
memo status

# With audit log
memo status --audit

# JSON output
memo status --json
```

**Output:**
```
Memory Graph Status
==================
Entities: 12
  - projects: 3
  - developers: 4
  - libraries: 3
  - patterns: 2

Facts: 45
  - Active: 42
  - Superseded: 3

Last operation: 2026-01-30T21:35:00Z
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

Outputs documentation for AI agents on how to use the memory system.

**Examples:**
```bash
memo help-agent
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

## Examples

### Daily Workflow

```bash
# Initialize project
memo init

# Extract facts from code review
cat review-comments.md | memo extract

# Synthesize updated summaries
memo synthesize --all

# Verify everything is valid
memo verify

# Check status
memo status
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
