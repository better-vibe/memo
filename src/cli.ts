import { Command } from 'commander';
import { initCommand } from './commands/init';
import { extractCommand } from './commands/extract';
import { synthesizeCommand } from './commands/synthesize';
import { viewCommand } from './commands/view';
import { editCommand } from './commands/edit';
import { verifyCommand } from './commands/verify';
import { statusCommand } from './commands/status';
import { exportCommand } from './commands/export';
import { importCommand } from './commands/import';
import { helpAgentCommand } from './commands/help-agent';
import { syncDocsCommand } from './commands/sync-docs';
import { queryCommand } from './commands/query';
import { draftCommand } from './commands/draft';
import { contextCommand } from './commands/context';
import { helpCommand } from './commands/help';

const program = new Command();

program
  .name('memo')
  .description('Three-layer technical knowledge graph CLI')
  .version('1.1.0');

// Global hooks to implement behavior for global options like --verbose, --no-edit, and --force.
program.hook('preAction', (thisCommand, actionCommand) => {
  const rootOpts = thisCommand.opts() as {
    verbose?: boolean;
    noEdit?: boolean;
    force?: boolean;
  };

  // Enable basic verbose logging for all commands when --verbose is set.
  if (rootOpts.verbose) {
    // Use stderr for logging to avoid interfering with JSON or other machine-readable output on stdout.
    try {
      // actionCommand.opts() contains the options specific to the invoked subcommand.
      const cmdOpts = actionCommand.opts();
      // Avoid circular refs or non-serializable values in logging by falling back gracefully.
      const safeOpts = JSON.stringify(cmdOpts);
      console.error(
        `[memo] Running command "${actionCommand.name()}" with options: ${safeOpts}`
      );
    } catch {
      console.error(`[memo] Running command "${actionCommand.name()}"`);
    }
  }

  // Propagate global "no edit" / batch mode to the environment so commands can honor it consistently.
  if (rootOpts.noEdit) {
    process.env.MEMO_NO_EDIT = '1';
  }

  // Propagate global "force" behavior similarly, so downstream code can opt into skipping safety checks.
  if (rootOpts.force) {
    process.env.MEMO_FORCE = '1';
  }
});

// Global options
function addGlobalOpts(cmd: Command): Command {
  return cmd
    .option('--json', 'Machine-readable JSON output', false)
    .option('--project <path>', 'Project root', process.cwd())
    .option('--dry-run', 'Preview changes without writing', false)
    .option('--no-edit', 'Skip prompts (batch mode)')
    .option('--verbose', 'Log all operations', false)
    .option('--force', 'Skip safety checks', false);
}

addGlobalOpts(
  program
    .command('init')
    .description('Initialize three-layer memory system')
).action(async (opts) => {
  process.exitCode = await initCommand(opts);
});

addGlobalOpts(
  program
    .command('extract')
    .description('Extract facts from input')
    .option('--source <source>', 'Input source: stdin, file path, or inline', 'stdin')
    .option('--data <data>', 'Inline data (alternative to piping)')
).action(async (opts) => {
  process.exitCode = await extractCommand(opts);
});

addGlobalOpts(
  program
    .command('synthesize')
    .description('Rewrite summaries from facts')
    .option('--all', 'Synthesize all entities', false)
    .option('--entity <path>', 'Entity to synthesize (type/slug)')
).action(async (opts) => {
  process.exitCode = await synthesizeCommand(opts);
});

addGlobalOpts(
  program
    .command('view <entity>')
    .description('Inspect entity and facts')
    .option('--full', 'Show all facts including superseded', false)
).action(async (entity, opts) => {
  process.exitCode = await viewCommand({ ...opts, entity });
});

addGlobalOpts(
  program
    .command('edit <entity>')
    .description('Open entity summary in $EDITOR')
).action(async (entity, opts) => {
  process.exitCode = await editCommand({ ...opts, entity });
});

addGlobalOpts(
  program
    .command('verify')
    .description('Check graph validity and contradictions')
).action(async (opts) => {
  process.exitCode = await verifyCommand(opts);
});

addGlobalOpts(
  program
    .command('status')
    .description('Show graph state and audit log')
    .option('--audit', 'Show audit log', false)
    .option('--detailed', 'Show category breakdown, entity types, and link statistics', false)
).action(async (opts) => {
  process.exitCode = await statusCommand(opts);
});

addGlobalOpts(
  program
    .command('export')
    .description('Backup graph to JSON')
    .option('--output <path>', 'Output file path', 'memo-export.json')
).action(async (opts) => {
  process.exitCode = await exportCommand(opts);
});

addGlobalOpts(
  program
    .command('import')
    .description('Restore graph from JSON backup')
    .option('--input <path>', 'Input file path', '-')
).action(async (opts) => {
  process.exitCode = await importCommand(opts);
});

addGlobalOpts(
  program
    .command('help-agent')
    .description('Generate agent integration guide')
    .option('--list-docs', 'List available documentation files')
    .option('--show-doc <name>', 'Show specific documentation file')
).action(async (opts) => {
  process.exitCode = await helpAgentCommand(opts);
});

addGlobalOpts(
  program
    .command('sync-docs')
    .description('Sync AI agent documentation to memory/docs/')
).action(async (opts) => {
  process.exitCode = await syncDocsCommand(opts);
});

addGlobalOpts(
  program
    .command('query')
    .description('Query facts with filters and search')
    .option('--entity-type <type>', 'Filter by entity type (projects,libraries,patterns)')
    .option('--category <cat>', 'Filter by category (dependency,version,constraint,architecture,decision,ownership,expertise,bug,tech_debt,rule,status)')
    .option('--status <status>', 'Filter by status (active,superseded)')
    .option('--source <pattern>', 'Filter by source pattern (regex)')
    .option('--query <text>', 'Search fact text (regex)')
    .option('--evidence-contains <text>', 'Search evidence field (regex)')
    .option('--tag <tags>', 'Filter by tags (comma-separated, AND logic)')
    .option('--exclude-expired', 'Exclude facts past their expiresAt date', false)
    .option('--related-to <entity>', 'Query entities related to target (type/slug)')
    .option('--where <clause>', 'Compound where clause (e.g., confidence>0.8, category=dependency)', collect, [])
).action(async (opts) => {
  process.exitCode = await queryCommand(opts);
});

addGlobalOpts(
  program
    .command('draft')
    .description('Queue facts for later extraction (AI agent workflow)')
    .option('--add <fact>', 'Add a fact to the draft queue')
    .option('--list', 'List all queued drafts')
    .option('--flush', 'Extract all queued drafts to knowledge graph')
    .option('--clear', 'Clear draft queue without extracting')
).action(async (opts) => {
  process.exitCode = await draftCommand(opts);
});

addGlobalOpts(
  program
    .command('context')
    .description('Generate AI-optimized context dump for session startup')
    .option('--entity-type <type>', 'Filter to specific entity type')
    .option('--entity <path>', 'Focus on a specific entity (type/slug)')
    .option('--max-facts <n>', 'Maximum facts per entity')
    .option('--compact', 'Compact output (one line per fact)', false)
    .option('--include-decisions', 'Include DECISIONS.md content', false)
    .option('--include-agents', 'Include AGENTS.md content', false)
).action(async (opts) => {
  process.exitCode = await contextCommand(opts);
});

addGlobalOpts(
  program
    .command('help [command]')
    .description('Show help information')
).action(async (command, opts) => {
  process.exitCode = await helpCommand({ ...opts, command });
});

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});

// Helper to collect multiple --where arguments
function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}
