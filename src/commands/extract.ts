import * as fs from 'fs';
import { MemoryGraph } from '../core/graph';
import { ExtractionProposal, validateExtractionProposals, validateExtractionProposalsDetailed, ValidationError } from '../core/validation';
import { slugify } from '../core/entity';

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
  let parsedInput: unknown;
  try {
    parsedInput = JSON.parse(input);
  } catch {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Input must be valid JSON array of extraction proposals.' }));
    } else {
      console.error('Input must be valid JSON array of extraction proposals.');
      console.error('See `memo help-agent` for the expected format.');
    }
    return 1;
  }

  // Validate with detailed errors
  const validation = validateExtractionProposalsDetailed(parsedInput);
  if (!validation.valid) {
    if (options.json) {
      console.log(JSON.stringify({ 
        status: 'error', 
        message: 'Invalid extraction proposals',
        validationErrors: validation.errors 
      }));
    } else {
      console.error('❌ Invalid extraction proposals:');
      validation.errors.forEach(e => {
        console.error(`\n  Fact ${e.factIndex !== undefined ? e.factIndex : 'unknown'}.${e.field}:`);
        console.error(`    Received: ${JSON.stringify(e.received)}`);
        console.error(`    Error: ${e.message}`);
        if (e.suggestion) console.error(`    💡 ${e.suggestion}`);
        if (e.allowedValues) console.error(`    Allowed: ${e.allowedValues.join(', ')}`);
      });
    }
    return 1;
  }
  proposals = parsedInput as ExtractionProposal[];

  // Enhanced dry-run with detailed preview
  if (options.dryRun) {
    const preview = generateDryRunPreview(graph, proposals);
    
    if (options.json) {
      console.log(JSON.stringify({
        status: 'ok',
        dryRun: true,
        proposalCount: proposals.length,
        operations: preview,
      }));
    } else {
      console.log(`🔍 Dry run: ${proposals.length} proposal(s) analyzed\n`);
      
      if (preview.createEntities.length > 0) {
        console.log(`Would create ${preview.createEntities.length} new entity/entities:`);
        preview.createEntities.forEach(e => console.log(`  + ${e.type}/${e.slug} (${e.name})`));
        console.log('');
      }
      
      if (preview.updateEntities.length > 0) {
        console.log(`Would update ${preview.updateEntities.length} existing entity/entities:`);
        preview.updateEntities.forEach(e => {
          console.log(`  ~ ${e.type}/${e.slug}:`);
          console.log(`    New facts: ${e.newFacts.length}`);
          e.newFacts.forEach(f => console.log(`      - ${f}`));
          if (e.supersededFacts.length > 0) {
            console.log(`    Superseded facts: ${e.supersededFacts.length}`);
            e.supersededFacts.forEach(f => console.log(`      ~ ${f}`));
          }
        });
        console.log('');
      }
      
      if (preview.links.length > 0) {
        console.log(`Would create ${preview.links.length} relationship link(s):`);
        preview.links.forEach(l => console.log(`  ↔ ${l.from} ${l.relation} ${l.to}`));
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

/**
 * Generate detailed preview of what would happen during extraction
 */
function generateDryRunPreview(graph: MemoryGraph, proposals: ExtractionProposal[]) {
  const createEntities: Array<{type: string; slug: string; name: string}> = [];
  const updateEntities: Array<{
    type: string; 
    slug: string; 
    newFacts: string[];
    supersededFacts: string[];
  }> = [];
  const links: Array<{from: string; to: string; relation: string}> = [];
  
  const processedEntities = new Map<string, {newFacts: string[]; supersededFacts: string[]}>
  
  for (const proposal of proposals) {
    const slug = slugify(proposal.entityName);
    const entityKey = `${proposal.entityType}/${slug}`;
    
    // Check if entity exists
    if (!graph.entityExists(proposal.entityType as any, slug)) {
      if (!createEntities.find(e => e.type === proposal.entityType && e.slug === slug)) {
        createEntities.push({
          type: proposal.entityType,
          slug,
          name: proposal.entityName,
        });
      }
    }
    
    // Track facts
    if (!processedEntities.has(entityKey)) {
      processedEntities.set(entityKey, { newFacts: [], supersededFacts: [] });
    }
    const entityOps = processedEntities.get(entityKey)!;
    
    // Check for contradictions (simplified version - real implementation would check existing facts)
    if (proposal.category === 'version' || proposal.category === 'dependency') {
      // Would potentially supersede existing facts
      entityOps.supersededFacts.push(`Previous ${proposal.category} (if exists)`);
    }
    
    entityOps.newFacts.push(proposal.fact);
    
    // Detect links from fact text
    const linkPatterns = [
      { regex: /uses?\s+(\w+)/i, relation: 'uses' },
      { regex: /implements?\s+(\w+)/i, relation: 'implements' },
      { regex: /depends?\s+on\s+(\w+)/i, relation: 'depends_on' },
    ];
    
    for (const pattern of linkPatterns) {
      const match = proposal.fact.match(pattern.regex);
      if (match) {
        const targetName = match[1].toLowerCase();
        // Try to guess entity type
        let targetType = 'libraries';
        if (['pattern', 'strategy', 'architecture'].some(p => targetName.includes(p))) {
          targetType = 'patterns';
        }
        
        links.push({
          from: entityKey,
          to: `${targetType}/${targetName}`,
          relation: pattern.relation,
        });
      }
    }
  }
  
  // Convert processed entities to update list
  for (const [key, ops] of processedEntities) {
    const [type, slug] = key.split('/');
    if (!createEntities.find(e => e.type === type && e.slug === slug)) {
      updateEntities.push({
        type,
        slug,
        newFacts: ops.newFacts,
        supersededFacts: ops.supersededFacts,
      });
    }
  }
  
  return {
    createEntities,
    updateEntities,
    links,
  };
}
