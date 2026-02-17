import * as fs from 'fs';
import * as path from 'path';
import { listPrompts, loadPrompt, getPromptsSourceDir } from '../core/prompts';

export interface HelpAgentOptions {
  json: boolean;
  listDocs?: boolean;
  showDoc?: string;
  project?: string;
}

const AGENT_GUIDE = `# Agent Integration Guide for memo

## Quick Start

1. Initialize memo: \`memo init\`
2. Generate agent config: \`memo integrate <type>\`
   This creates a config file (CLAUDE.md, .cursorrules, etc.) with memo instructions.
3. Read \`memory/docs/three-layer-memory-system.md\` to understand the architecture
4. Use commands below to interact with the knowledge graph
5. Read \`memory/docs/extract.md\` for fact extraction format

## Agent Config Generation

Generate agent-specific config files with \`memo integrate\`:

\`\`\`bash
memo integrate claude          # generates CLAUDE.md
memo integrate cursor          # generates .cursorrules
memo integrate claude cursor   # generates both
memo integrate all             # generates all supported
\`\`\`

Supported types: \`claude\`, \`cursor\`, \`codex\`, or \`all\`.
Config files contain session startup, draft workflow, and CLI reference.

## Documentation Location

All AI agent documentation is in \`memory/docs/\`:
- \`three-layer-memory-system.md\` - System overview and invariants
- \`extract.md\` - How to format facts for extraction
- \`synthesize.md\` - How to rewrite summaries
- \`facts-item-schema.md\` - JSON schema for facts
- \`agents.md\` - Operating rules
- \`decisions.md\` - Decision log format
- \`entity-naming-and-resolution.md\` - Entity conventions
- \`entity-summary-template.md\` - Summary templates

## Extraction Format
Pass a JSON array of fact proposals to \`memo extract\`:

\`\`\`json
[
  {
    "entityType": "projects|libraries|patterns",
    "entityName": "Display Name",
    "fact": "Atomic, specific claim",
    "category": "dependency|version|constraint|architecture|decision|ownership|expertise|bug|tech_debt|rule|status",
    "timestamp": "YYYY-MM-DD",
    "source": "conversation",
    "confidence": 0.9,
    "evidence": "Short quote or reference"
  }
]
\`\`\`

## Usage
\`\`\`bash
# Extract facts (pipe JSON proposals via stdin)
echo '<json>' | memo extract --source stdin --json --no-edit

# Synthesize all summaries
memo synthesize --all --json --no-edit

# Verify consistency
memo verify --json

# View entity
memo view projects/my-project --json

# Query facts
memo query --category dependency --json

# Export backup
memo export --output backup.json

# Import backup
memo import --input backup.json --json
\`\`\`

## Key Flags for Agents
- \`--json\`: Machine-readable output
- \`--no-edit\`: Skip interactive prompts
- \`--dry-run\`: Preview without writing

## Exit Codes
- 0: Success
- 1: Error
- 2: Warning
- 3: Conflict (use --force)

## What to Extract
- Dependency versions, breaking changes
- Architecture decisions + rationale
- Project status, constraints
- Known bugs, tech debt
- Coding standards, rules

## What to Skip
- Ephemeral errors, debugging output
- Session-specific details
- Temporary plans
`;

export async function helpAgentCommand(options: HelpAgentOptions): Promise<number> {
  // Handle --list-docs
  if (options.listDocs) {
    const docs = listPrompts();
    if (options.json) {
      console.log(JSON.stringify({ status: 'ok', docs }));
    } else {
      console.log('Available documentation in memory/docs/:');
      docs.forEach(doc => console.log(`  - ${doc}.md`));
    }
    return 0;
  }

  // Handle --show-doc
  if (options.showDoc) {
    const content = loadPrompt(options.showDoc);
    if (!content) {
      if (options.json) {
        console.log(JSON.stringify({ status: 'error', message: `Documentation not found: ${options.showDoc}` }));
      } else {
        console.error(`Documentation not found: ${options.showDoc}`);
        console.error('Use --list-docs to see available documentation.');
      }
      return 1;
    }

    if (options.json) {
      console.log(JSON.stringify({ status: 'ok', name: options.showDoc, content }));
    } else {
      console.log(content);
    }
    return 0;
  }

  // Default: show guide
  if (options.json) {
    const docs = listPrompts();
    console.log(JSON.stringify({ 
      status: 'ok', 
      guide: AGENT_GUIDE,
      availableDocs: docs,
    }));
  } else {
    console.log(AGENT_GUIDE);
  }
  return 0;
}
