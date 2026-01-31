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

  // Handle AGENTS.md - append if exists, create if not, overwrite if force
  const agentsContent = loadPrompt('agents') || '# AGENTS\n\n<!-- Add agent rules and constraints below -->\n';
  if (options.force || !fs.existsSync(graph.agentsPath)) {
    // Force overwrite or create new
    atomicWriteText(graph.agentsPath, agentsContent);
  } else {
    // File exists, check if memo content already present
    const existingContent = fs.readFileSync(graph.agentsPath, 'utf-8');
    const hasMemoSection = existingContent.includes('## Memory System') || 
                           existingContent.includes('Three-Layer Memory System') ||
                           existingContent.includes('three-layer-memory-system');
    if (!hasMemoSection) {
      // Append memo section to existing file
      const memoSection = `\n\n${agentsContent}`;
      atomicWriteText(graph.agentsPath, existingContent + memoSection);
    }
  }

  // Handle DECISIONS.md - append if exists, create if not, overwrite if force
  const decisionsContent = loadPrompt('decisions') || '# Technical Decisions\n\n<!-- Add decisions below -->\n';
  if (options.force || !fs.existsSync(graph.decisionsPath)) {
    // Force overwrite or create new
    atomicWriteText(graph.decisionsPath, decisionsContent);
  } else {
    // File exists, check if memo content already present
    const existingContent = fs.readFileSync(graph.decisionsPath, 'utf-8');
    const hasMemoSection = existingContent.includes('Knowledge Graph') ||
                           existingContent.includes('Entity slugs in knowledge graph');
    if (!hasMemoSection) {
      // Append memo section to existing file
      const memoSection = `\n\n${decisionsContent}`;
      atomicWriteText(graph.decisionsPath, existingContent + memoSection);
    }
  }

  // Copy AI agent documentation to memory/docs/
  const docsResult = copyPromptsToProject(graph.projectRoot);
  const docsDir = getProjectDocsDir(graph.projectRoot);

  if (options.json) {
    const result: any = {
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
    };
    if (docsResult.errors.length > 0) {
      result.warnings = docsResult.errors;
    }
    console.log(JSON.stringify(result));
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
  }

  return 0;
}
