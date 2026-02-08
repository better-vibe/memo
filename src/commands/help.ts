export interface HelpOptions {
  json: boolean;
  command?: string;
}

const HELP_TEXT = `
memo - Three-layer technical knowledge graph CLI

USAGE:
  memo <command> [options]

COMMANDS:
  init              Initialize memory system (--agent claude|cursor|codex)
  extract           Extract facts from input
  draft             Queue facts for later extraction
  synthesize        Rewrite summaries from facts
  view              Inspect entity and facts
  query             Query facts with filters and search
  edit              Open entity summary in $EDITOR
  verify            Check graph validity and contradictions
  status            Show graph state and audit log
  export            Backup graph to JSON
  import            Restore graph from JSON backup
  help-agent        Generate agent integration guide
  sync-docs         Sync AI agent documentation to memory/docs/
  help              Show this help message

GLOBAL OPTIONS:
  --json            Machine-readable JSON output
  --project <path>  Project root directory (default: current directory)
  --dry-run         Preview changes without writing
  --no-edit         Skip prompts (batch mode)
  --verbose         Log all operations
  --force           Skip safety checks
  -h, --help        Show help
  -V, --version     Show version

EXAMPLES:
  # Initialize memo in current directory
  memo init

  # Initialize with Claude Code integration
  memo init --agent claude

  # Extract facts from stdin
  echo '[{"entityType": "projects", "entityName": "my-app", "fact": "Uses React", "category": "dependency", "timestamp": "2025-01-31", "source": "analysis"}]' | memo extract

  # Queue facts for later extraction
  memo draft --add "Uses TypeScript 5.9"
  memo draft --add "Implements atomic writes"
  memo draft --flush

  # View an entity
  memo view projects/my-app

  # Query facts
  memo query --category dependency
  memo query --where "confidence>0.8"

  # Search evidence
  memo query --evidence-contains "package.json"

For more information, visit: https://github.com/better-vibe/memo
`;

const COMMAND_HELP: Record<string, string> = {
  init: `
memo init - Initialize three-layer memory system

USAGE:
  memo init [options]

OPTIONS:
  --agent <types>  Generate AI agent config files (comma-separated)
                   Supported: claude, cursor, codex
                     claude  → CLAUDE.md
                     cursor  → .cursorrules
                     codex   → AGENTS.md (default, always created)
  --force          Reinitialize even if already initialized

DESCRIPTION:
  Creates the memory graph structure with entity directories,
  AGENTS.md, DECISIONS.md, and AI agent documentation.

  When --agent is provided, generates agent-specific config files
  containing memo integration instructions so the AI agent
  automatically knows how to use the knowledge graph.

  After initialization, prints a quick-start reference so the
  agent can begin using memo immediately.

EXAMPLES:
  memo init                        # basic init
  memo init --agent claude         # init + generate CLAUDE.md
  memo init --agent cursor         # init + generate .cursorrules
  memo init --agent claude,cursor  # init + generate both
  memo init --force --agent claude # reinitialize + overwrite CLAUDE.md
`,
  extract: `
memo extract - Extract facts from input

USAGE:
  memo extract [options]

OPTIONS:
  --source <source>  Input source: stdin, file path, or inline (default: stdin)
  --data <data>      Inline data (alternative to piping)
  --dry-run          Preview changes without writing

DESCRIPTION:
  Reads JSON array of extraction proposals and adds facts to the
  knowledge graph. Auto-detects entity links and creates bidirectional
  relationships.

EXAMPLE:
  echo '[{"entityType": "projects", "entityName": "my-app", "fact": "Uses React", "category": "dependency", "timestamp": "2025-01-31", "source": "analysis"}]' | memo extract
`,
  draft: `
memo draft - Queue facts for later extraction

USAGE:
  memo draft [options]

OPTIONS:
  --add <fact>   Add a fact to the draft queue
  --list         List all queued drafts
  --flush        Extract all queued drafts to knowledge graph
  --clear        Clear draft queue without extracting

DESCRIPTION:
  Accumulate facts without breaking coding flow. Facts are queued
  in memory/_meta/draft.json until flushed.

EXAMPLE:
  memo draft --add "Uses TypeScript 5.9"
  memo draft --add "Implements atomic writes"
  memo draft --list
  memo draft --flush
`,
  view: `
memo view - Inspect entity and facts

USAGE:
  memo view <entity> [options]

ARGUMENTS:
  entity    Entity path in format type/slug (e.g., projects/my-app)

OPTIONS:
  --full    Show all facts including superseded

DESCRIPTION:
  Displays entity summary and all facts with evidence, source,
  confidence, and related entities.

EXAMPLE:
  memo view projects/my-app
  memo view projects/my-app --full
`,
  query: `
memo query - Query facts with filters and search

USAGE:
  memo query [options]

OPTIONS:
  --entity-type <type>       Filter by entity type
  --category <cat>           Filter by category
  --status <status>          Filter by status (active, superseded)
  --source <pattern>         Filter by source (regex)
  --query <text>             Search fact text (regex)
  --evidence-contains <text> Search evidence field (regex)
  --related-to <entity>      Query related entities
  --where <clause>           Compound where clause (e.g., confidence>0.8)

DESCRIPTION:
  Advanced querying with multiple filters and search capabilities.
  Supports compound where clauses for complex queries.

EXAMPLES:
  memo query --category dependency
  memo query --where "confidence>0.8" --category dependency
  memo query --evidence-contains "package.json"
  memo query --related-to projects/my-app
`,
};

export async function helpCommand(options: HelpOptions): Promise<number> {
  if (options.command && COMMAND_HELP[options.command]) {
    if (options.json) {
      console.log(JSON.stringify({
        status: 'ok',
        command: options.command,
        help: COMMAND_HELP[options.command],
      }));
    } else {
      console.log(COMMAND_HELP[options.command]);
    }
  } else {
    if (options.json) {
      console.log(JSON.stringify({
        status: 'ok',
        help: HELP_TEXT,
        availableCommands: Object.keys(COMMAND_HELP),
      }));
    } else {
      console.log(HELP_TEXT);
    }
  }
  return 0;
}
