# Configuration

## Project Structure

After running `memo init`, your project will have:

```
my-project/
├── memory/
│   ├── graph/
│   │   ├── projects/
│   │   ├── libraries/
│   │   └── patterns/
│   ├── _meta/
│   │   ├── audit.json
│   │   └── entities.json
│   └── docs/            # AI agent documentation
├── AGENTS.md
├── DECISIONS.md
├── CLAUDE.md            # (if --agent claude)
└── .cursorrules         # (if --agent cursor)
```

## Initializing a Project

```bash
# Navigate to project root
cd my-project

# Initialize memo
memo init

# Initialize with AI agent config files
memo init --agent claude          # generates CLAUDE.md
memo init --agent cursor          # generates .cursorrules
memo init --agent claude,cursor   # generates both

# Or force reinitialize
memo init --force
```

## AGENTS.md

This file contains **stable rules and constraints** for AI agents.

### Default Template

```markdown
# AGENTS — Operating Rules

## Memory System — Three Layers

### Layer 1: Knowledge Graph (`~/memory/graph/`)
Structure:
- `projects/<project-slug>/summary.md` + `items.json`
- `libraries/<lib-slug>/summary.md` + `items.json`
- `patterns/<pattern-slug>/summary.md` + `items.json`

Tiered retrieval order:
1. `summary.md` (default context window)
2. `items.json` (loaded for history/rationale/verification)
3. `AGENTS.md` (stable rules and constraints)
4. `DECISIONS.md` (decision rationale and trade-offs)

Rules:
- Durable facts MUST be stored as atomic items in `items.json`.
- Facts MUST include timestamp and source.
- Never delete facts. Mark superseded and link via `supersededBy`.
- Summaries MUST be rewritten from active facts, keeping them short and current.
- If an entity does not exist, create it with `summary.md` + `items.json`.

### Writing Discipline
- Prefer small, composable writes.
- All file updates MUST be atomic (write temp file + rename).
- Changes MUST be idempotent.

### What to Remember vs Skip
Remember: dependency versions, architecture decisions, code constraints, developer roles, project status, known bugs, tech debt.
Skip: ephemeral error logs, one-off debugging, temporary feature flags, session-specific details.

### Conflict Handling
- Add new fact as `active`, mark old as `superseded`, link via `supersededBy`.
```

### Customizing

Edit `AGENTS.md` to add project-specific rules:

```markdown
## Project-Specific Rules

### Naming Conventions
- All database tables must use snake_case
- API endpoints use kebab-case

### Code Review Requirements
- All PRs need 2 approvals
- Security-sensitive changes need security team review
```

## DECISIONS.md

Contains **architecture decision records (ADRs)**.

### Default Template

```markdown
# Technical Decisions

## Format
Each decision section includes:
- **Decision**: Short title
- **Date Decided**: ISO date
- **Rationale**: Why this choice was made
- **Trade-offs**: What was given up
- **Status**: active | superseded | under_review
- **Related Facts**: Entity slugs in knowledge graph

<!-- Add decisions below -->
```

### Example Entry

```markdown
## Decision: Use PostgreSQL over MySQL

- **Date Decided**: 2024-06-15
- **Rationale**: Better JSON support, stricter ACID compliance, team expertise
- **Trade-offs**: Slightly more complex setup, smaller hosting options
- **Status**: active
- **Related Facts**: projects/my-app (dependency), libraries/postgresql (dependency)
```

## AI Agent Config Files

When you initialize memo with the `--agent` flag, agent-specific configuration files are generated so your AI tool automatically knows how to use the knowledge graph.

### Supported Agent Types

| Agent Type | Config File | Description |
|------------|-------------|-------------|
| `claude` | `CLAUDE.md` | Instructions for Claude Code (session startup, draft workflow, query patterns) |
| `cursor` | `.cursorrules` | Instructions for Cursor AI (same workflow, plain-text format) |
| `codex` | `AGENTS.md` | Uses the default AGENTS.md (always created by `memo init`) |

### Usage

```bash
# Single agent
memo init --agent claude

# Multiple agents (comma-separated)
memo init --agent claude,cursor

# Overwrite existing configs
memo init --force --agent claude
```

### Idempotent Behavior

- If the target file **does not exist**, memo creates it with full memo instructions.
- If the target file **already exists** without a memo section, memo appends the memo section.
- If the target file **already has** a memo section, it is skipped (unless `--force` is used).

### Generated Content

Each config file includes:
- Session startup instructions (`memo context --compact`)
- Draft workflow for low-friction fact capture
- Query patterns for retrieving context before changes
- Full CLI reference with key flags
- Guidance on what to extract vs. skip

### Git Integration

When using `--agent`, add the generated files to version control:

```bash
git add CLAUDE.md .cursorrules
git commit -m "Add AI agent configuration for memo"
```

## Git Integration

### .gitignore

Add to your `.gitignore`:

```gitignore
# memo temporary files
.tmp-*
```

Note: The `memory/` directory should be committed to version control.

### Committing Changes

```bash
# After extracting facts
git add memory/ AGENTS.md DECISIONS.md
git commit -m "Update knowledge graph with new dependencies"
```

## Multiple Projects

memo uses the current working directory by default. For multiple projects:

```bash
# Project A
cd /projects/a && memo status

# Project B
cd /projects/b && memo status

# Or use --project flag
memo status --project /projects/a
```

## Editor Configuration

### VS Code

Add to `.vscode/settings.json`:

```json
{
  "files.associations": {
    "**/memory/**/items.json": "jsonc"
  },
  "search.exclude": {
    "**/memory/_meta/**": true
  }
}
```

## Global Options File

You can create `.memorc.json` in your project root:

```json
{
  "project": ".",
  "verbose": false,
  "json": false
}
```

Note: This is not yet implemented but planned for future versions.

## Environment-Specific Configuration

### Development

```bash
# Verbose mode for debugging
export MEMO_VERBOSE=1
```

### CI/CD

```bash
# Machine-readable output
memo verify --json

# Non-interactive mode
memo extract --no-edit < facts.json
```

## Next Steps

- [CLI Reference](../06-cli) — Available commands
- [Output Formats](../08-output) — Understanding generated files
