import * as fs from 'fs';
import * as path from 'path';
import { MemoryGraph } from '../core/graph';
import { AgentType, VALID_AGENT_TYPES, parseAgentTypes, generateAgentConfigs } from '../core/agent-config';
import { initCommand } from './init';

export interface IntegrateOptions {
  project: string;
  json: boolean;
  force: boolean;
  agents?: string[];
  list?: boolean;
}

export async function integrateCommand(options: IntegrateOptions): Promise<number> {
  const graph = new MemoryGraph(options.project);

  if (!graph.isInitialized()) {
    if (!options.json) {
      console.log('Memory graph not initialized. Running memo init...');
    }
    const initResult = await initCommand({
      project: options.project,
      json: options.json,
      force: false,
    });
    if (initResult !== 0) {
      return initResult;
    }
    if (!options.json) {
      console.log('');
    }
  }

  if (options.list) {
    if (options.json) {
      console.log(JSON.stringify({
        status: 'ok',
        supportedAgents: VALID_AGENT_TYPES,
        configFiles: getAgentConfigFiles(graph.projectRoot)
      }));
    } else {
      console.log('Supported agents:');
      VALID_AGENT_TYPES.forEach(agent => {
        const file = getAgentConfigFile(agent, graph.projectRoot);
        const exists = fs.existsSync(file);
        console.log(`  ${agent.padEnd(10)} ${file}${exists ? ' (exists)' : ''}`);
      });
    }
    return 0;
  }

  if (!options.agents || options.agents.length === 0) {
    if (options.json) {
      console.log(JSON.stringify({
        status: 'error',
        message: 'Specify agents to integrate. Use --list to see available agents.'
      }));
    } else {
      console.error('Specify agents to integrate.');
      console.log('  memo integrate cursor');
      console.log('  memo integrate claude cursor');
      console.log('  memo integrate all');
      console.log('');
      console.log('Use --list to see available agents.');
    }
    return 1;
  }

  const agentsInput = options.agents.join(',');
  const agents = agentsInput === 'all'
    ? [...VALID_AGENT_TYPES]
    : parseAgentTypes(agentsInput);

  if (agents.length === 0) {
    const msg = `Unknown agent type(s): "${agentsInput}". Valid types: ${VALID_AGENT_TYPES.join(', ')}`;
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: msg }));
    } else {
      console.error(msg);
    }
    return 1;
  }

  const result = generateAgentConfigs(graph.projectRoot, agents, { force: options.force });

  if (options.json) {
    console.log(JSON.stringify({
      status: 'ok',
      message: 'Agent integration complete',
      configs: result,
      projectRoot: graph.projectRoot,
      help: getQuickStartHelp()
    }));
  } else {
    console.log('✅ Agent integration complete');
    if (result.generated.length > 0) {
      console.log(`   Generated: ${result.generated.join(', ')}`);
    }
    if (result.skipped.length > 0) {
      console.log(`   Skipped:   ${result.skipped.join(', ')}`);
    }
    if (result.errors.length > 0) {
      result.errors.forEach(e => console.error(`   Error: ${e}`));
    }
    console.log('');
    console.log(getQuickStartHelp());
  }

  return result.errors.length > 0 ? 2 : 0;
}

function getAgentConfigFile(agent: AgentType, projectRoot: string): string {
  switch (agent) {
    case 'claude':
      return path.join(projectRoot, 'CLAUDE.md');
    case 'cursor':
      return path.join(projectRoot, '.cursor', 'rules', 'memo.mdc');
    case 'codex':
      return path.join(projectRoot, 'AGENTS.md');
  }
}

function getAgentConfigFiles(projectRoot: string): Record<AgentType, string> {
  return {
    claude: getAgentConfigFile('claude', projectRoot),
    cursor: getAgentConfigFile('cursor', projectRoot),
    codex: getAgentConfigFile('codex', projectRoot)
  };
}

function getQuickStartHelp(): string {
  return `---

Run these commands at the START of every session:
  memo context --compact       Load project context (entities, facts, decisions)

During work, capture facts without interruption:
  memo draft --add "<fact>"    Queue a fact
  memo draft --flush            Extract all queued facts

Before making changes:
  memo query --json            Query facts with filters
  memo view <type>/<slug>      Inspect an entity

Before committing:
  memo verify --json           Check graph consistency

Key flags:
  --json       Machine-readable output
  --no-edit    Skip prompts (batch mode)
  --dry-run    Preview changes without writing`;
}
