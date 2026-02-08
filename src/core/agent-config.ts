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

/**
 * Parse a comma-separated agent string into validated agent types.
 */
export function parseAgentTypes(input: string): AgentType[] {
  return input
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter((s): s is AgentType => VALID_AGENT_TYPES.includes(s as AgentType));
}

/**
 * Get the output file path for a given agent type.
 */
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

/**
 * Generate agent-specific config files for the given agent types.
 */
export function generateAgentConfigs(
  projectRoot: string,
  agents: AgentType[],
  options: { force?: boolean } = {},
): AgentConfigResult {
  const result: AgentConfigResult = { generated: [], skipped: [], errors: [] };

  for (const agent of agents) {
    const filePath = agentConfigPath(projectRoot, agent);
    const fileName = path.basename(filePath);

    // For codex, skip — AGENTS.md is already handled by initCommand directly
    if (agent === 'codex') {
      result.skipped.push(`${fileName} (managed by memo init directly)`);
      continue;
    }

    if (fs.existsSync(filePath) && !options.force) {
      // File exists: check if memo section is already present
      const existing = fs.readFileSync(filePath, 'utf-8');
      if (hasMemoSection(existing)) {
        result.skipped.push(`${fileName} (memo section already present)`);
        continue;
      }
      // Append memo section to existing file
      try {
        const section = getMemoSection(agent);
        atomicWriteText(filePath, existing + '\n\n' + section);
        result.generated.push(`${fileName} (appended memo section)`);
      } catch (err: any) {
        result.errors.push(`${fileName}: ${err.message}`);
      }
    } else {
      // Create new file or force overwrite
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

function hasMemoSection(content: string): boolean {
  return content.includes('memo') && (
    content.includes('memo extract') ||
    content.includes('memo draft') ||
    content.includes('memo context') ||
    content.includes('knowledge graph memory')
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

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const MEMO_COMMANDS_REFERENCE = `## memo CLI Reference

\`\`\`bash
# Bootstrap session context (run at start of every conversation)
memo context --compact

# Queue facts during work (low-friction)
memo draft --add "Uses React 19 with server components"
memo draft --add "Auth tokens expire after 24h"
memo draft --flush          # extract all queued drafts

# Extract structured facts directly
echo '[{
  "entityType": "projects",
  "entityName": "my-app",
  "fact": "Migrated from Express to Fastify",
  "category": "architecture",
  "timestamp": "2025-06-15",
  "source": "migration PR #412"
}]' | memo extract --json

# Query existing knowledge
memo query --category dependency --json
memo query --entity-type projects --json
memo view projects/my-app --json

# Verify graph consistency
memo verify --json
\`\`\`

### Key Flags
- \`--json\`: Always use for machine-readable output
- \`--no-edit\`: Skip interactive prompts (batch mode)
- \`--dry-run\`: Preview changes without writing

### What to Extract
- Dependency versions, breaking changes
- Architecture decisions and rationale
- Project constraints and rules
- Known bugs, tech debt
- Coding standards

### What to Skip
- Ephemeral errors, debugging output
- Session-specific details
- Temporary plans`;

const CLAUDE_MD_TEMPLATE = `# Project Instructions

This project uses **memo** — a three-layer knowledge graph memory system.
The knowledge graph persists durable technical facts across sessions in \`memory/\`.

## Session Startup

At the start of every conversation, load project context:

\`\`\`bash
memo context --compact
\`\`\`

This gives you the current state of all known entities, facts, and decisions.

## During Work

As you discover important facts (dependencies, architecture decisions, constraints,
bugs, patterns), queue them so they are not lost:

\`\`\`bash
memo draft --add "<atomic, specific fact>"
\`\`\`

At natural breakpoints (after finishing a feature, before switching topics), flush:

\`\`\`bash
memo draft --flush
\`\`\`

## Before Making Changes

Query the knowledge graph for relevant context:

\`\`\`bash
memo query --query "<topic>" --json
memo view <entityType>/<slug> --json
\`\`\`

${MEMO_COMMANDS_REFERENCE}
`;

const CLAUDE_MEMO_SECTION = `
## memo — Persistent Knowledge Graph

This project uses **memo** for durable technical memory across sessions.

At session start, run: \`memo context --compact\`
During work, queue facts: \`memo draft --add "<fact>"\`
At breakpoints, flush: \`memo draft --flush\`

${MEMO_COMMANDS_REFERENCE}
`;

const CURSORRULES_TEMPLATE = `# Project Rules

This project uses **memo** — a three-layer knowledge graph memory system.
The knowledge graph persists durable technical facts across sessions in \`memory/\`.

## Session Startup

At the start of every conversation, load project context:

memo context --compact

This gives you the current state of all known entities, facts, and decisions.

## During Work

As you discover important facts (dependencies, architecture decisions, constraints,
bugs, patterns), queue them so they are not lost:

memo draft --add "<atomic, specific fact>"

At natural breakpoints (after finishing a feature, before switching topics), flush:

memo draft --flush

## Before Making Changes

Query the knowledge graph for relevant context:

memo query --query "<topic>" --json
memo view <entityType>/<slug> --json

## memo CLI Reference

# Bootstrap session context (run at start of every conversation)
memo context --compact

# Queue facts during work (low-friction)
memo draft --add "Uses React 19 with server components"
memo draft --flush

# Extract structured facts directly
echo '[{"entityType": "projects", "entityName": "my-app", "fact": "Migrated from Express to Fastify", "category": "architecture", "timestamp": "2025-06-15", "source": "migration PR #412"}]' | memo extract --json

# Query existing knowledge
memo query --category dependency --json
memo view projects/my-app --json

# Verify graph consistency
memo verify --json

## Key Flags
- --json: Always use for machine-readable output
- --no-edit: Skip interactive prompts (batch mode)
- --dry-run: Preview changes without writing

## What to Extract
- Dependency versions, breaking changes
- Architecture decisions and rationale
- Project constraints and rules
- Known bugs, tech debt
- Coding standards

## What to Skip
- Ephemeral errors, debugging output
- Session-specific details
- Temporary plans
`;

const CURSOR_MEMO_SECTION = `
## memo — Persistent Knowledge Graph

This project uses **memo** for durable technical memory across sessions.

At session start, run: memo context --compact
During work, queue facts: memo draft --add "<fact>"
At breakpoints, flush: memo draft --flush

## memo CLI Reference

memo context --compact          # Load session context
memo draft --add "<fact>"       # Queue a fact
memo draft --flush              # Extract queued drafts
memo query --category <cat> --json  # Query facts
memo view <type>/<slug> --json  # View entity
memo verify --json              # Check consistency
`;
