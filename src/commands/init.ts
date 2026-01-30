import * as fs from 'fs';
import { MemoryGraph } from '../core/graph';
import { atomicWriteText } from '../core/facts';

export interface InitOptions {
  project: string;
  json: boolean;
  force: boolean;
}

const AGENTS_TEMPLATE = `# AGENTS — Operating Rules

## Memory System — Three Layers

### Layer 1: Knowledge Graph (\`~/memory/graph/\`)
Structure:
- \`projects/<project-slug>/summary.md\` + \`items.json\`
- \`developers/<dev-slug>/summary.md\` + \`items.json\`
- \`libraries/<lib-slug>/summary.md\` + \`items.json\`
- \`patterns/<pattern-slug>/summary.md\` + \`items.json\`

Tiered retrieval order:
1. \`summary.md\` (default context window)
2. \`items.json\` (loaded for history/rationale/verification)
3. \`AGENTS.md\` (stable rules and constraints)
4. \`DECISIONS.md\` (decision rationale and trade-offs)

Rules:
- Durable facts MUST be stored as atomic items in \`items.json\`.
- Facts MUST include timestamp and source.
- Never delete facts. Mark superseded and link via \`supersededBy\`.
- Summaries MUST be rewritten from active facts, keeping them short and current.
- If an entity does not exist, create it with \`summary.md\` + \`items.json\`.

### Writing Discipline
- Prefer small, composable writes.
- All file updates MUST be atomic (write temp file + rename).
- Changes MUST be idempotent.

### What to Remember vs Skip
Remember: dependency versions, architecture decisions, code constraints, developer roles, project status, known bugs, tech debt.
Skip: ephemeral error logs, one-off debugging, temporary feature flags, session-specific details.

### Conflict Handling
- Add new fact as \`active\`, mark old as \`superseded\`, link via \`supersededBy\`.
`;

const DECISIONS_TEMPLATE = `# Technical Decisions

## Format
Each decision section includes:
- **Decision**: Short title
- **Date Decided**: ISO date
- **Rationale**: Why this choice was made
- **Trade-offs**: What was given up
- **Status**: active | superseded | under_review
- **Related Facts**: Entity slugs in knowledge graph

<!-- Add decisions below -->
`;

export async function initCommand(options: InitOptions): Promise<number> {
  const graph = new MemoryGraph(options.project);

  if (graph.isInitialized() && !options.force) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Memory graph already initialized. Use --force to reinitialize.' }));
    } else {
      console.error('Memory graph already initialized. Use --force to reinitialize.');
    }
    return 3;
  }

  graph.initialize();

  // Write AGENTS.md if not exists or force
  if (!fs.existsSync(graph.agentsPath) || options.force) {
    atomicWriteText(graph.agentsPath, AGENTS_TEMPLATE);
  }

  // Write DECISIONS.md if not exists or force
  if (!fs.existsSync(graph.decisionsPath) || options.force) {
    atomicWriteText(graph.decisionsPath, DECISIONS_TEMPLATE);
  }

  if (options.json) {
    console.log(JSON.stringify({
      status: 'ok',
      message: 'Memory graph initialized',
      paths: {
        graph: graph.graphRoot,
        agents: graph.agentsPath,
        decisions: graph.decisionsPath,
        meta: graph.metaRoot,
      },
    }));
  } else {
    console.log('✅ Memory graph initialized');
    console.log(`   Graph:     ${graph.graphRoot}`);
    console.log(`   Agents:    ${graph.agentsPath}`);
    console.log(`   Decisions: ${graph.decisionsPath}`);
    console.log(`   Meta:      ${graph.metaRoot}`);
  }

  return 0;
}
