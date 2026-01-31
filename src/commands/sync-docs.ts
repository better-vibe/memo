import { MemoryGraph } from '../core/graph';
import { copyPromptsToProject, getProjectDocsDir } from '../core/prompts';

export interface SyncDocsOptions {
  project: string;
  json: boolean;
  dryRun: boolean;
  verbose: boolean;
}

export async function syncDocsCommand(options: SyncDocsOptions): Promise<number> {
  const graph = new MemoryGraph(options.project);

  if (!graph.isInitialized()) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Memory graph not initialized. Run `memo init` first.' }));
    } else {
      console.error('Memory graph not initialized. Run `memo init` first.');
    }
    return 1;
  }

  const docsDir = getProjectDocsDir(graph.projectRoot);

  if (options.dryRun) {
    const promptsDir = getProjectDocsDir(graph.projectRoot).replace('/memory/docs', '/src/prompts');
    if (options.json) {
      console.log(JSON.stringify({
        status: 'ok',
        dryRun: true,
        message: 'Would sync documentation files',
        docsDir,
      }));
    } else {
      console.log(`Dry run: Would sync documentation to ${docsDir}`);
    }
    return 0;
  }

  const result = copyPromptsToProject(graph.projectRoot);

  if (options.json) {
    const output: any = {
      status: result.errors.length > 0 ? 'warning' : 'ok',
      docsDir,
      copied: result.copied,
    };
    if (result.errors.length > 0) {
      output.errors = result.errors;
    }
    console.log(JSON.stringify(output));
  } else {
    if (result.errors.length > 0) {
      console.log(`⚠️  Synced documentation with warnings (${result.copied} files)`);
      result.errors.forEach(e => console.error(`   Warning: ${e}`));
    } else {
      console.log(`✅ Synced documentation (${result.copied} files)`);
      console.log(`   Docs: ${docsDir}`);
    }
  }

  return result.errors.length > 0 ? 2 : 0;
}
