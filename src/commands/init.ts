import * as fs from 'fs';
import * as path from 'path';
import { MemoryGraph } from '../core/graph';
import { atomicWriteText } from '../core/facts';
import { copyPromptsToProject, getProjectDocsDir, loadPrompt } from '../core/prompts';
import { AgentType, VALID_AGENT_TYPES, parseAgentTypes, generateAgentConfigs } from '../core/agent-config';

export interface InitOptions {
  project: string;
  json: boolean;
  force: boolean;
  agent?: string;
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

  // Generate agent-specific config files when --agent is provided
  let agentResult: { generated: string[]; skipped: string[]; errors: string[] } | undefined;
  if (options.agent) {
    const agents = parseAgentTypes(options.agent);
    if (agents.length === 0) {
      const msg = `Unknown agent type(s): "${options.agent}". Valid types: ${VALID_AGENT_TYPES.join(', ')}`;
      if (options.json) {
        console.log(JSON.stringify({ status: 'error', message: msg }));
      } else {
        console.error(msg);
      }
      return 1;
    }
    agentResult = generateAgentConfigs(graph.projectRoot, agents, { force: options.force });
  }

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
    if (agentResult) {
      result.agentConfigs = agentResult;
    }
    result.help = getQuickStartHelp(options.agent);
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
    if (agentResult) {
      if (agentResult.generated.length > 0) {
        console.log(`   Agent configs generated: ${agentResult.generated.join(', ')}`);
      }
      if (agentResult.skipped.length > 0) {
        console.log(`   Agent configs skipped:   ${agentResult.skipped.join(', ')}`);
      }
      if (agentResult.errors.length > 0) {
        agentResult.errors.forEach(e => console.error(`   Warning: ${e}`));
      }
    }
    // Print quick-start help so the agent can immediately start using memo
    console.log('');
    console.log(getQuickStartHelp(options.agent));
  }

  return 0;
}

function getQuickStartHelp(agentFlag?: string): string {
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
  memo help-agent              Full AI agent integration guide

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
