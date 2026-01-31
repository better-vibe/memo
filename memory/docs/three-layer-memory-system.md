# Three-Layer Memory System (Self-Maintaining Technical Knowledge Graph)

## Goal
Turn static agent memory into a self-maintaining system that:
- Extracts durable technical facts from conversations
- Stores facts by entity (knowledge graph), not as a blob
- Rewrites lean summaries on-demand or at interval
- Never deletes facts—supersedes them to preserve decision history
- Keeps context current and searchable

## The Three Layers

### Layer 1 — Knowledge Graph (`/memory/graph/`)
Entity-centric, durable, structured memory.
- `/memory/graph/projects/<project-slug>/`
- `/memory/graph/libraries/<lib-slug>/`
- `/memory/graph/patterns/<pattern-slug>/`

Each entity folder contains:
- `summary.md` — current snapshot (rewritten on-demand)
- `items.json` — append-only-ish atomic facts with status transitions

### Layer 2 — Technical Decisions (`DECISIONS.md`)
Rationale and trade-offs for significant choices.
- Why a tool was chosen
- Why an architecture pattern was adopted
- Constraints and their justification
- Not indexed by time; indexed by decision

### Layer 3 — Agent Rules (`AGENTS.md`)
Stable operating principles and constraints:
- How the agent should handle code review
- Default tech stack preferences
- Deployment constraints
- Coding standards and linting rules
- Long-lived patterns observed in the codebase

## Invariants (Hard Rules)
1. **No silent deletion.** Facts are never removed; they are superseded.
2. **Entity-based storage.** Durable facts MUST live in the relevant entity's `items.json`.
3. **Summaries stay lean.** Retrieval loads `summary.md` by default; `items.json` is loaded only when needed.
4. **Provenance required.** Each fact MUST include timestamp and source.
5. **Idempotent updates.** Extraction MUST tolerate re-runs without duplicating facts.

## Folder Structure (Canonical)
Create these roots:
- `~/memory/graph/projects/`
- `~/memory/graph/libraries/`
- `~/memory/graph/patterns/`
- `~/memory/_meta/` (implementation may store state here)

## Data Flow
Conversation
→ Extract durable technical facts
→ write to Layer 1 items.json
→ (manual or on-demand) synthesize summaries
→ better context next chat

## Retrieval Policy (Tiered)
When responding:
1. Prefer `summary.md` for each relevant entity (fast, current).
2. Load `items.json` only if:
   - user asks for history/rationale
   - ambiguity exists
   - summary is missing
3. Use `AGENTS.md` for agent constraints and patterns.
4. Use `DECISIONS.md` for "why" context.

## Definition: "Durable Fact"
A durable technical fact is likely to matter for future tasks and remain true for weeks+, OR is a change-of-state:
- Dependency version changes
- Architecture decisions and their rationale
- Code constraints and rules
- Project status (active, archived, in-progress)
- Known bugs or tech debt items
- API stability or breaking changes

Non-durable (skip):
- Temporary debugging output
- Single-run error messages (unless part of a pattern)
- One-off clarifications unless they reveal a stable rule

## Security/Privacy Baseline
- Do not store API keys, credentials, or tokens verbatim.
- Store references only ("uses auth service X") unless user explicitly approves detail storage.
- If unsure: store high-level fact, skip the detail.

## Implementation Checklist
- [ ] Implement entity resolution + slugging
- [ ] Implement fact extraction prompt + writer
- [ ] Implement `items.json` read/merge/supersede with atomic writes
- [ ] Implement on-demand summary synthesis
- [ ] Implement fact deduplication and contradiction detection