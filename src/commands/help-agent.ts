export interface HelpAgentOptions {
  json: boolean;
}

const AGENT_GUIDE = `# Agent Integration Guide for memo

## Extraction Format
Pass a JSON array of fact proposals to \`memo extract\`:

\`\`\`json
[
  {
    "entityType": "projects|developers|libraries|patterns",
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

# Search facts
memo search "fastify" --json

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
- Developer roles and expertise
- Project status, constraints
- Known bugs, tech debt
- Coding standards, rules

## What to Skip
- Ephemeral errors, debugging output
- Session-specific details
- Temporary plans
`;

export async function helpAgentCommand(options: HelpAgentOptions): Promise<number> {
  if (options.json) {
    console.log(JSON.stringify({ status: 'ok', guide: AGENT_GUIDE }));
  } else {
    console.log(AGENT_GUIDE);
  }
  return 0;
}
