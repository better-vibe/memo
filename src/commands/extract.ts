import * as fs from 'fs';
import { MemoryGraph } from '../core/graph';
import { ExtractionProposal, validateExtractionProposals } from '../core/validation';

export interface ExtractOptions {
  project: string;
  source: string;
  data?: string;
  json: boolean;
  noEdit: boolean;
  dryRun: boolean;
  verbose: boolean;
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
    // If stdin is a TTY (interactive), just resolve empty after a brief check
    if (process.stdin.isTTY) {
      resolve('');
    }
  });
}

export async function extractCommand(options: ExtractOptions): Promise<number> {
  const graph = new MemoryGraph(options.project);

  if (!graph.isInitialized()) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Memory graph not initialized. Run memo init first.' }));
    } else {
      console.error('Memory graph not initialized. Run `memo init` first.');
    }
    return 1;
  }

  let input: string;
  if (options.source === 'stdin' || options.source === '-') {
    if (options.data) {
      input = options.data;
    } else {
      input = await readStdin();
    }
  } else if (fs.existsSync(options.source)) {
    input = fs.readFileSync(options.source, 'utf-8');
  } else {
    // Treat source as inline data
    input = options.source;
  }

  if (!input.trim()) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'ok', factsAdded: 0, entitiesUpdated: [] }));
    } else {
      console.log('No input provided.');
    }
    return 0;
  }

  // Parse input as JSON array of extraction proposals
  let proposals: ExtractionProposal[];
  try {
    const parsed = JSON.parse(input);
    const validation = validateExtractionProposals(parsed);
    if (!validation.valid) {
      if (options.json) {
        console.log(JSON.stringify({ status: 'error', message: 'Invalid extraction proposals', errors: validation.errors }));
      } else {
        console.error('Invalid extraction proposals:');
        validation.errors.forEach(e => console.error(`  - ${e}`));
      }
      return 1;
    }
    proposals = parsed;
  } catch {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Input must be valid JSON array of extraction proposals.' }));
    } else {
      console.error('Input must be valid JSON array of extraction proposals.');
      console.error('See `memo help-agent` for the expected format.');
    }
    return 1;
  }

  if (options.dryRun) {
    if (options.json) {
      console.log(JSON.stringify({
        status: 'ok',
        dryRun: true,
        proposalCount: proposals.length,
        proposals,
      }));
    } else {
      console.log(`Dry run: ${proposals.length} fact(s) would be added.`);
      for (const p of proposals) {
        console.log(`  ${p.entityType}/${p.entityName}: ${p.fact}`);
      }
    }
    return 0;
  }

  const result = graph.addFacts(proposals, options.source === 'stdin' || options.source === '-' ? 'stdin' : options.source);

  if (options.json) {
    console.log(JSON.stringify({
      status: 'ok',
      factsAdded: result.factsAdded,
      factsSuperseded: result.factsSuperseded,
      entitiesUpdated: result.entitiesUpdated,
    }));
  } else {
    console.log(`✅ Extracted ${result.factsAdded} fact(s) across ${result.entitiesUpdated.length} entity/entities.`);
    if (result.factsSuperseded > 0) {
      console.log(`   ${result.factsSuperseded} fact(s) superseded.`);
    }
  }

  return 0;
}
