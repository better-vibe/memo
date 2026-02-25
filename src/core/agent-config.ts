import * as fs from 'fs';
import * as path from 'path';
import { atomicWriteText } from './facts';

export type AgentType = 'claude' | 'cursor' | 'codex';

export const VALID_AGENT_TYPES: AgentType[] = ['claude', 'cursor', 'codex'];

interface AgentConfigResult {
  generated: string[];
  skipped: string[];
  errors: string[];
}

export function parseAgentTypes(input: string): AgentType[] {
  return input
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter((s): s is AgentType => VALID_AGENT_TYPES.includes(s as AgentType));
}

function cursorRulesDir(projectRoot: string): string {
  return path.join(projectRoot, '.cursor', 'rules');
}

function agentConfigPath(projectRoot: string, agent: AgentType): string {
  switch (agent) {
    case 'claude':
      return path.join(projectRoot, 'CLAUDE.md');
    case 'cursor':
      return path.join(projectRoot, '.cursorrules');
    case 'codex':
      return path.join(projectRoot, 'AGENTS.md');
  }
}

export function generateAgentConfigs(
  projectRoot: string,
  agents: AgentType[],
  options: { force?: boolean } = {},
): AgentConfigResult {
  const result: AgentConfigResult = { generated: [], skipped: [], errors: [] };

  for (const agent of agents) {
    if (agent === 'codex') {
      result.skipped.push('AGENTS.md (managed by memo init)');
      continue;
    }

    if (agent === 'cursor') {
      try {
        const cursorResult = generateCursorRules(projectRoot, options.force ?? false);
        result.generated.push(...cursorResult.generated);
        result.skipped.push(...cursorResult.skipped);
        result.errors.push(...cursorResult.errors);
      } catch (err: any) {
        result.errors.push(`cursor: ${err.message}`);
      }
      continue;
    }

    const filePath = agentConfigPath(projectRoot, agent);
    const fileName = path.basename(filePath);

    if (fs.existsSync(filePath) && !options.force) {
      const existing = fs.readFileSync(filePath, 'utf-8');
      if (hasMemoSection(existing)) {
        result.skipped.push(`${fileName} (memo section already present)`);
        continue;
      }
      try {
        const section = getMemoSection(agent);
        atomicWriteText(filePath, existing + '\n\n' + section);
        result.generated.push(`${fileName} (appended memo section)`);
      } catch (err: any) {
        result.errors.push(`${fileName}: ${err.message}`);
      }
    } else {
      try {
        const content = getFullTemplate(agent);
        atomicWriteText(filePath, content);
        result.generated.push(fileName);
      } catch (err: any) {
        result.errors.push(`${fileName}: ${err.message}`);
      }
    }
  }

  return result;
}

function generateCursorRules(projectRoot: string, force: boolean): AgentConfigResult {
  const result: AgentConfigResult = { generated: [], skipped: [], errors: [] };
  const rulesDir = cursorRulesDir(projectRoot);

  const mdcPath = path.join(rulesDir, 'memo.mdc');

  if (!fs.existsSync(rulesDir)) {
    try {
      fs.mkdirSync(rulesDir, { recursive: true });
    } catch (err: any) {
      result.errors.push(`.cursor/rules: ${err.message}`);
      return result;
    }
  }

  if (!force && fs.existsSync(mdcPath)) {
    const existing = fs.readFileSync(mdcPath, 'utf-8');
    if (existing.includes('memo knowledge graph')) {
      result.skipped.push('.cursor/rules/memo.mdc (memo rule already present)');
    } else {
      try {
        atomicWriteText(mdcPath, getCursorRulesMdcContent());
        result.generated.push('.cursor/rules/memo.mdc');
      } catch (err: any) {
        result.errors.push(`.cursor/rules/memo.mdc: ${err.message}`);
      }
    }
  } else {
    try {
      atomicWriteText(mdcPath, getCursorRulesMdcContent());
      result.generated.push('.cursor/rules/memo.mdc');
    } catch (err: any) {
      result.errors.push(`.cursor/rules/memo.mdc: ${err.message}`);
    }
  }

  return result;
}

function hasMemoSection(content: string): boolean {
  return content.includes('memo') && (
    content.includes('memo extract') ||
    content.includes('memo draft') ||
    content.includes('memo context') ||
    content.includes('knowledge graph')
  );
}

function getMemoSection(agent: AgentType): string {
  switch (agent) {
    case 'claude':
      return CLAUDE_MEMO_SECTION;
    case 'cursor':
      return CURSOR_MEMO_SECTION;
    case 'codex':
      return '';
  }
}

function getFullTemplate(agent: AgentType): string {
  switch (agent) {
    case 'claude':
      return CLAUDE_MD_TEMPLATE;
    case 'cursor':
      return CURSORRULES_TEMPLATE;
    case 'codex':
      return '';
  }
}

function getCursorRulesMdcContent(): string {
  return `---
description: "Instructions for using memo knowledge graph - capture dependencies, architecture decisions, constraints, and bugs"
alwaysApply: false
---

## memo Knowledge Graph

This project uses memo, a three-layer knowledge graph that stores durable technical facts in \`memory/\`.

### Why Use memo

- Avoid repeating past architectural decisions
- Track dependency versions, security patches, breaking changes
- Preserve rationale for key decisions
- Document known bugs and tech debt

### Workflow

**Session Startup** — Run at the start of every conversation:
\`\`\`bash
memo context --compact
\`\`\`

**During Work** — Use explicit \`memo extract\` for durable facts:
\`\`\`bash
echo '[{"entityType": "projects", "entityName": "<project-slug>", "fact": "Uses React 19 with server components", "category": "dependency", "timestamp": "2025-01-31", "source": "package.json"}]' | memo extract --source stdin
\`\`\`

**Low-Friction Scratch Notes** (optional — does NOT guarantee correct entity routing):
\`\`\`bash
memo draft --add "Auth tokens expire after 24h"
\`\`\`

> Avoid \`memo draft --flush\` for durable writes. It uses heuristic inference and may route facts to \`projects/unknown\`. Convert drafts to explicit extract proposals instead.

**Before Changes** — Query existing knowledge:
\`\`\`bash
memo query --category dependency --json
memo query --entity-type projects --json
memo view projects/<project-slug> --json
\`\`\`

**Before Committing** — Verify consistency:
\`\`\`bash
memo verify --json
\`\`\`

### Key Commands

| Command | Purpose |
|---------|---------|
| \`memo context --compact\` | Load session context |
| \`echo '[...]' \\| memo extract\` | Extract facts with explicit routing |
| \`memo draft --add "<fact>"\` | Queue a scratch note (optional) |
| \`memo query --json\` | Query facts |
| \`memo view <type>/<slug> --json\` | Inspect entity |
| \`memo verify --json\` | Check consistency |

### What to Capture

**Extract**: dependency versions, breaking changes, architecture decisions, code constraints, known bugs, tech debt.

**Skip**: debugging output, session details, temporary plans.

### Flags

- \`--json\` — Machine-readable output
- \`--no-edit\` — Skip prompts (batch mode)
- \`--dry-run\` — Preview changes`;
}

const COMMON_WORKFLOW = `## When to Run memo Commands

### Session Startup
Run at the START of every conversation:
\`\`\`bash
memo context --compact
\`\`\`
This loads all known entities, facts, and decisions into context.

### During Work — Durable Extraction (Preferred)
Use explicit \`memo extract\` with \`entityType\` and \`entityName\` for deterministic routing:
\`\`\`bash
echo '[{"entityType": "projects", "entityName": "<project-slug>", "fact": "Uses React 19 with server components", "category": "dependency", "timestamp": "2025-01-31", "source": "package.json"}]' | memo extract --source stdin
\`\`\`

### During Work — Scratch Notes (Optional)
Queue free-text insights without breaking flow. These are NOT durably routed:
\`\`\`bash
memo draft --add "Auth tokens expire after 24h"
memo draft --list                   Show queued drafts
\`\`\`

> **Caution:** \`memo draft --flush\` uses heuristic inference and may route facts to \`projects/unknown\`. Convert queued drafts to explicit extract proposals instead.

### Before Making Changes
Query existing knowledge to avoid repeating past decisions:
\`\`\`bash
memo query --category dependency --json
memo query --entity-type projects --json
memo view projects/<project-slug> --json
\`\`\`

### Before Committing
Verify graph consistency before finishing:
\`\`\`bash
memo verify --json
\`\`\`

## CLI Reference

\`\`\`bash
# Session bootstrap
memo context --compact              Load all entities, facts, decisions

# Extract structured facts (deterministic — always specify entityType + entityName)
echo '<json>' | memo extract --source stdin

# Scratch notes (optional — heuristic routing, not guaranteed)
memo draft --add "<fact>"           Queue a scratch note
memo draft --list                   Show queued drafts

# Query knowledge
memo query --json                   Query all facts
memo query --category <cat> --json  Filter by category
memo query --entity-type <type> --json

# View entities
memo view <type>/<slug> --json

# Graph maintenance
memo synthesize --all --json        Rewrite summaries
memo verify --json                  Check consistency

# Backup/restore
memo export --output backup.json
memo import --input backup.json
\`\`\`

## Key Flags
- \`--json\`: Always use for machine-readable output
- \`--no-edit\`: Skip interactive prompts (batch mode)
- \`--dry-run\`: Preview changes without writing

## What to Extract
Capture durable technical facts:
- Dependency versions, security patches, breaking changes
- Architecture decisions and their rationale
- Code constraints, linting standards, rules
- Known bugs, tech debt, architectural debt
- Developer expertise and ownership

## What to Skip
Don't capture ephemeral information:
- One-off debugging output
- Session-specific details
- Temporary feature flags
- Unconfirmed plans`;

const CLAUDE_MD_TEMPLATE = `# Project Instructions

This project uses **memo** — a three-layer knowledge graph memory system.

## Overview

memo persists durable technical facts across sessions in \`memory/\`. It helps avoid:
- Repeating past architectural decisions
- Forgetting dependency versions or constraints
- Losing track of why certain choices were made

## Workflow

### 1. Session Startup
At the start of every conversation, run:
\`\`\`bash
memo context --compact
\`\`\`

### 2. During Work — Durable Extraction (Preferred)
Use explicit \`memo extract\` with \`entityType\` and \`entityName\`:
\`\`\`bash
echo '[{"entityType": "projects", "entityName": "<project-slug>", "fact": "<specific fact>", "category": "dependency", "timestamp": "YYYY-MM-DD", "source": "<source>"}]' | memo extract --source stdin
\`\`\`

### 2b. Scratch Notes (Optional)
Queue free-text insights without breaking flow:
\`\`\`bash
memo draft --add "<insight>"
\`\`\`

> **Caution:** \`memo draft --flush\` uses heuristic inference and may route facts to \`projects/unknown\`. Convert queued drafts to explicit extract proposals instead.

### 3. Before Changes
Query existing knowledge:
\`\`\`bash
memo query --query "<topic>" --json
memo view <entityType>/<slug> --json
\`\`\`

### 4. Before Committing
Check graph consistency:
\`\`\`bash
memo verify --json
\`\`\`

${COMMON_WORKFLOW}
`;

const CLAUDE_MEMO_SECTION = `
## memo — Knowledge Graph Memory

This project uses **memo** for persistent technical memory.

### Session Start
\`\`\`bash
memo context --compact
\`\`\`

### During Work — Durable Extraction
\`\`\`bash
echo '[{"entityType": "projects", "entityName": "<project-slug>", "fact": "<fact>", "category": "<cat>", "timestamp": "YYYY-MM-DD", "source": "<src>"}]' | memo extract --source stdin
\`\`\`

### Scratch Notes (Optional)
\`\`\`bash
memo draft --add "<insight>"   # Queue for review (not durably routed)
\`\`\`

### Before Changes
\`\`\`bash
memo query --json
memo view <type>/<slug> --json
\`\`\`

### Before Commit
\`\`\`bash
memo verify --json
\`\`\`

${COMMON_WORKFLOW}
`;

const CURSORRULES_TEMPLATE = `# Project Rules

This project uses **memo** — a three-layer knowledge graph memory system.

> ⚠️ **Note**: The modern format is \`.cursor/rules/memo.mdc\`. This \`.cursorrules\` file is for backward compatibility.

## Why memo?

memo stores durable technical facts in \`memory/\` that persist across sessions:
- Dependency versions and constraints
- Architecture decisions and rationale
- Code rules and standards
- Known bugs and tech debt

## Workflow

### 1. Session Startup (ALWAYS)
At the start of EVERY conversation:
\`\`\`
memo context --compact
\`\`\`
This loads all entities, facts, and decisions into context.

### 2. During Work — Durable Extraction (Preferred)
Use explicit \`memo extract\` with entityType and entityName:
\`\`\`
echo '[{"entityType": "projects", "entityName": "<project-slug>", "fact": "<fact>", "category": "<category>", "timestamp": "YYYY-MM-DD", "source": "<source>"}]' | memo extract --source stdin
\`\`\`

### 2b. Scratch Notes (Optional)
Queue free-text insights without breaking flow:
\`\`\`
memo draft --add "Auth tokens expire after 24h"
\`\`\`

> Avoid \`memo draft --flush\` for durable writes. It uses heuristic inference and may route facts to \`projects/unknown\`. Convert drafts to explicit extract proposals instead.

### 3. Before Making Changes
Query existing knowledge to avoid repeating decisions:
\`\`\`
memo query --category dependency --json
memo query --entity-type projects --json
memo view projects/<project-slug> --json
\`\`\`

### 4. Before Committing
Verify consistency:
\`\`\`
memo verify --json
\`\`\`

## Commands Reference

### Bootstrap
\`\`\`
memo context --compact              # Load session context
\`\`\`

### Extract Facts (Deterministic — always specify entityType + entityName)
\`\`\`
echo '<json>' | memo extract --source stdin
\`\`\`

### Scratch Notes (Optional — heuristic routing, not guaranteed)
\`\`\`
memo draft --add "<fact>"           # Queue a scratch note
memo draft --list                    # Show queued drafts
\`\`\`

### Query Knowledge
\`\`\`
memo query --json                   # Query all facts
memo query --category <cat> --json  # Filter by category
memo query --entity-type <type> --json
memo query --query "<text>" --json
\`\`\`

### View Entities
\`\`\`
memo view <type>/<slug> --json
\`\`\`

### Maintenance
\`\`\`
memo synthesize --all --json        # Rewrite summaries
memo verify --json                  # Check consistency
memo export --output backup.json
memo import --input backup.json
\`\`\`

## Key Flags
- --json: Always use for machine-readable output
- --no-edit: Skip interactive prompts (batch mode)
- --dry-run: Preview changes without writing

## What to Extract
- Dependency versions, security patches, breaking changes
- Architecture decisions + rationale
- Code constraints, linting standards
- Known bugs, tech debt
- Developer expertise

## What to Skip
- Debugging output
- Session-specific details
- Temporary plans`;

const CURSOR_MEMO_SECTION = `
## memo — Knowledge Graph

This project uses memo for persistent technical memory.

### Session Start
memo context --compact

### During Work — Durable Extraction
echo '[{"entityType": "projects", "entityName": "<project-slug>", "fact": "<fact>", "category": "<cat>", "timestamp": "YYYY-MM-DD", "source": "<src>"}]' | memo extract --source stdin

### Scratch Notes (Optional)
memo draft --add "<insight>"   # Queue for review (not durably routed)

> Avoid memo draft --flush for durable writes — it may route facts to projects/unknown.

### Before Changes
memo query --json
memo view <type>/<slug> --json

### Before Commit
memo verify --json

## Commands

memo context --compact           Load session context
echo '<json>' | memo extract     Extract facts with explicit routing
memo draft --add "<fact>"       Queue a scratch note (optional)
memo query --json              Query facts
memo view <type>/<slug>        View entity
memo verify --json             Check consistency

## Key Flags
--json: Machine-readable output
--no-edit: Skip prompts
--dry-run: Preview
`;
