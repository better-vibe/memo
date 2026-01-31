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

---

## AI Agent Integration: Self-Documented Pain Points

### The Problem
During development of memo CLI enhancements, I (the AI agent) experienced friction using the tool I was building. This section documents those pain points for future improvement.

### Pain Points Experienced

#### 1. Context Switching Overhead
**Observation:** I consistently forgot to use `memo extract` during active coding.

**Why:** Switching from "writing code mode" to "constructing JSON facts mode" broke my flow. The mental model shift was too expensive during focused implementation.

**Evidence:** 
- Implemented 5 phases of features
- Only extracted facts at the beginning and end
- Missed documenting: validation improvements, schema changes, view enhancements, query implementation details

#### 2. No Draft Accumulation
**Observation:** I had insights while coding but no way to queue them for later extraction.

**Example:** While editing `validation.ts`, I thought "this error message format is much better" - but couldn't mark that insight for extraction without stopping to write JSON.

#### 3. Manual Translation Burden
**Observation:** Converting natural analysis into structured JSON was tedious.

**Current workflow:**
```
1. Analyze code → "Uses Zod for validation"
2. Manually translate to JSON structure
3. Execute extract command
```

**Missing:** Auto-translation from analysis to fact proposals.

#### 4. No Proactive Suggestions
**Observation:** Memo never prompted me to extract facts when I made relevant changes.

**What would have helped:**
- "You modified 3 files in src/core/ - extract architecture facts?"
- "You added a new command - document this in DECISIONS.md?"
- "You removed 'developers' entity - this is a breaking change, record it?"

#### 5. Retrieval Friction
**Observation:** I didn't query memo for context before making changes.

**Example:** Before modifying `view.ts`, I should have queried: "What are existing view command requirements?" But I didn't because:
- Extra command to type
- Unsure what to query for
- No automatic context loading

### Proposed Solutions

#### Solution 1: Draft Accumulation API
**Idea:** Let agents queue facts and flush them periodically.

**Interface:**
```bash
# Accumulate facts during work
memo draft --add "Projects now use TypeScript 5.9"
memo draft --add "Removed developers entity type"

# Flush when convenient
memo draft --flush
```

**Benefit:** No immediate context switching.

#### Solution 2: AGENTS.md Extraction Rules
**Idea:** Read AGENTS.md rules to guide extraction.

**Example:**
```markdown
## AI Agent Extraction Rules

When modifying src/core/*.ts:
- Extract architecture facts about patterns used
- Extract dependency facts for new imports
- Document breaking changes immediately

When adding commands:
- Add command summary to entity
- Document in DECISIONS.md if significant
```

**Benefit:** Agent knows what to extract without guessing.

#### Solution 3: Smart Change Detection
**Idea:** Memo watches file changes and suggests extractions.

**Implementation:**
```bash
memo watch --on-change suggest-extract
```

**Benefit:** Proactive rather than reactive.

### Implementation Priority

1. **High:** Draft accumulation API (quick win)
2. **High:** AGENTS.md extraction rules (guidance)  
3. **Medium:** Smart change detection (automation)

---

## AI Agent Extraction Guidelines

When working WITH memo (not just ON memo):

### DO Extract Facts When:
- Adding/modifying dependencies (package.json changes)
- Changing architecture or patterns
- Making breaking changes
- Discovering constraints or bugs
- Refactoring significant code areas

### Use This Template:
```bash
echo '[{
  "entityType": "projects|libraries|patterns",
  "entityName": "<name>",
  "fact": "<specific, atomic claim>",
  "category": "dependency|architecture|constraint|...",
  "timestamp": "YYYY-MM-DD",
  "source": "<file or operation that revealed this>",
  "confidence": 0.0-1.0,
  "evidence": "<quote or reference>"
}]' | memo extract --source stdin
```

### Query Before Changes:
```bash
# Check existing facts about a file
memo query --query "<filename>" --json

# Check related entities
memo query --related-to <entity> --json
```

### Draft Mode (Proposed):
```bash
# Queue insights during coding
memo draft --add "<insight>"

# Flush at end of session
memo draft --flush
```