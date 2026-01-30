import { Command } from 'commander';
import { initCommand } from './commands/init';
import { extractCommand } from './commands/extract';
import { synthesizeCommand } from './commands/synthesize';
import { viewCommand } from './commands/view';
import { searchCommand } from './commands/search';
import { editCommand } from './commands/edit';
import { verifyCommand } from './commands/verify';
import { statusCommand } from './commands/status';
import { exportCommand } from './commands/export';
import { importCommand } from './commands/import';
import { helpAgentCommand } from './commands/help-agent';

const program = new Command();

program
  .name('memo')
  .description('Three-layer technical knowledge graph CLI')
  .version('0.1.0');

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
    .command('search <query>')
    .description('Query facts across graph')
    .option('--category <cat>', 'Filter by category')
    .option('--entity-type <type>', 'Filter by entity type')
).action(async (query, opts) => {
  process.exitCode = await searchCommand({ ...opts, query });
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
).action(async (opts) => {
  process.exitCode = await helpAgentCommand(opts);
});

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
