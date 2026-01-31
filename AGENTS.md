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
- Facts MUST include timestamp and source (conversation ID, file path, etc.).
- Never delete facts. If a fact becomes invalid, mark it `superseded` and link to the new fact via `supersededBy`.
- Summaries MUST be rewritten (on-demand or by request) from active facts, keeping them short and current.
- If an entity does not exist, create it with `summary.md` + `items.json` using templates.

### Writing Discipline
- Prefer small, composable writes.
- All file updates MUST be atomic (write temp file + rename) to avoid corruption.
- Changes MUST be idempotent (re-running extraction should not duplicate facts).

### What to Remember vs Skip
Remember (durable):
- Dependency versions, security patches, breaking changes
- Architecture decisions and their rationale
- Code constraints, rules, linting standards
- Developer expertise, roles, and ownership
- Project status, milestone dates, deployment constraints
- Known bugs, tech debt, or architectural debt

Skip (non-durable):
- Ephemeral error logs
- One-off debugging output
- Temporary feature flags
- Session-specific details

### Conflict Handling
When a new fact contradicts an active fact:
- Add the new fact as `active`
- Mark the old fact as `superseded`
- Record linkage (`supersededBy`)
- Preserve both for historical traceability (e.g., version change history)

## Extraction Principles
- Prefer specificity (version numbers, file paths, exact constraints) over vague claims.
- Link related facts (if a bug is in library X v2.1, note the exact version).
- When a developer mentions a pattern they follow, capture it as a rule.

## Use Cases

### Code Review Context
Load project's active constraints, code standards, and known limitations to inform review.

### Refactoring
Load architecture decisions and their rationale to avoid repeating past mistakes.

### Debugging
Load known bugs, tech debt, and version-specific quirks to prioritize investigation.

### Onboarding New Code
Load developer expertise and project ownership to route questions correctly.