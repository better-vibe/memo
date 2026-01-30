import { MemoryGraph } from '../core/graph';

export interface VerifyOptions {
  project: string;
  json: boolean;
}

export async function verifyCommand(options: VerifyOptions): Promise<number> {
  const graph = new MemoryGraph(options.project);

  if (!graph.isInitialized()) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Memory graph not initialized.' }));
    } else {
      console.error('Memory graph not initialized. Run `memo init` first.');
    }
    return 1;
  }

  const result = graph.verify();

  if (options.json) {
    console.log(JSON.stringify({
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
    }));
  } else {
    if (result.valid && result.warnings.length === 0) {
      console.log('✅ Memory graph is valid.');
    } else {
      if (result.errors.length > 0) {
        console.error('Errors:');
        result.errors.forEach(e => console.error(`  ✗ ${e}`));
      }
      if (result.warnings.length > 0) {
        console.log('Warnings:');
        result.warnings.forEach(w => console.log(`  ⚠ ${w}`));
      }
    }
  }

  if (result.errors.length > 0) return 1;
  if (result.warnings.length > 0) return 2;
  return 0;
}
