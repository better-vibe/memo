import * as fs from 'fs';
import * as path from 'path';
import { MemoryGraph } from '../core/graph';
import { atomicWriteText } from '../core/facts';
import { copyPromptsToProject, getProjectDocsDir, loadPrompt } from '../core/prompts';

export interface InitOptions {
  project: string;
  json: boolean;
  force: boolean;
}

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

  const agentsContent = loadPrompt('agents') || '# AGENTS\n\n<!-- Add agent rules and constraints below -->\n';
  if (options.force || !fs.existsSync(graph.agentsPath)) {
    atomicWriteText(graph.agentsPath, agentsContent);
  } else {
    const existingContent = fs.readFileSync(graph.agentsPath, 'utf-8');
    const hasMemoSection = existingContent.includes('## Memory System') || 
                           existingContent.includes('Three-Layer Memory System') ||
                           existingContent.includes('three-layer-memory-system');
    if (!hasMemoSection) {
      const memoSection = `\n\n${agentsContent}`;
      atomicWriteText(graph.agentsPath, existingContent + memoSection);
    }
  }

  const decisionsContent = loadPrompt('decisions') || '# Technical Decisions\n\n<!-- Add decisions below -->\n';
  if (options.force || !fs.existsSync(graph.decisionsPath)) {
    atomicWriteText(graph.decisionsPath, decisionsContent);
  } else {
    const existingContent = fs.readFileSync(graph.decisionsPath, 'utf-8');
    const hasMemoSection = existingContent.includes('Knowledge Graph') ||
                           existingContent.includes('Entity slugs in knowledge graph');
    if (!hasMemoSection) {
      const memoSection = `\n\n${decisionsContent}`;
      atomicWriteText(graph.decisionsPath, existingContent + memoSection);
    }
  }

  const docsResult = copyPromptsToProject(graph.projectRoot);
  const docsDir = getProjectDocsDir(graph.projectRoot);

  if (options.json) {
    console.log(JSON.stringify({
      status: 'ok',
      message: 'Memory graph initialized',
      paths: {
        graph: graph.graphRoot,
        agents: graph.agentsPath,
        decisions: graph.decisionsPath,
        meta: graph.metaRoot,
        docs: docsDir,
      },
      docsCopied: docsResult.copied,
      help: getQuickStartHelp()
    }));
  } else {
    console.log('✅ Memory graph initialized');
    console.log(`   Graph:     ${graph.graphRoot}`);
    console.log(`   Agents:    ${graph.agentsPath}`);
    console.log(`   Decisions: ${graph.decisionsPath}`);
    console.log(`   Meta:      ${graph.metaRoot}`);
    console.log(`   Docs:      ${docsDir} (${docsResult.copied} files)`);
    if (docsResult.errors.length > 0) {
      docsResult.errors.forEach(e => console.error(`   Warning: ${e}`));
    }
    console.log('');
    console.log(getQuickStartHelp());
    console.log('');
    console.log('To integrate with AI coding agents, run:');
    console.log('   memo integrate claude cursor');
  }

  return 0;
}

function getQuickStartHelp(): string {
  return `--- Quick Start ---

COMMANDS:
  memo context --compact       Load session context (run at conversation start)
  memo draft --add "<fact>"    Queue a fact during work
  memo draft --flush           Extract all queued drafts to knowledge graph
  memo query --json            Query facts with filters
  memo view <type>/<slug>      Inspect an entity
  memo extract --json          Extract structured facts from JSON input
  memo synthesize --all        Rewrite all summaries from active facts
  memo verify --json           Check graph consistency
  memo status                  Show graph state
  memo help <command>          Detailed help for a command
  memo integrate <type>          Configure AI agent integration

KEY FLAGS:
  --json       Machine-readable JSON output
  --no-edit    Skip interactive prompts (batch mode)
  --dry-run    Preview changes without writing

WORKFLOW:
  1. memo context --compact          # bootstrap session
  2. <do work>
  3. memo draft --add "<insight>"     # capture facts as you go
  4. memo draft --flush               # persist at breakpoints`;
}
