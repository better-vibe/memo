import { spawnSync } from 'child_process';
import { MemoryGraph } from '../core/graph';
import { EntityType } from '../core/entity';
import * as entityMod from '../core/entity';

export interface EditOptions {
  project: string;
  entity: string;
  json: boolean;
}

export async function editCommand(options: EditOptions): Promise<number> {
  const graph = new MemoryGraph(options.project);

  if (!graph.isInitialized()) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Memory graph not initialized.' }));
    } else {
      console.error('Memory graph not initialized. Run `memo init` first.');
    }
    return 1;
  }

  const parts = options.entity.split('/');
  if (parts.length !== 2) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Entity must be type/slug' }));
    } else {
      console.error('Entity must be in format type/slug');
    }
    return 1;
  }

  const [rawEntityType, slug] = parts as [string, string];
  if (!entityMod.ENTITY_TYPES.includes(rawEntityType as EntityType)) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: `Invalid entity type: ${rawEntityType}` }));
    } else {
      console.error(`Invalid entity type: ${rawEntityType}`);
    }
    return 1;
  }
  const entityType = rawEntityType as EntityType;

  if (!graph.entityExists(entityType, slug)) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: `Entity ${options.entity} not found.` }));
    } else {
      console.error(`Entity ${options.entity} not found.`);
    }
    return 1;
  }

  const editor = process.env.EDITOR || process.env.VISUAL || 'vi';
  const summaryFile = entityMod.summaryPath(graph.graphRoot, entityType, slug);

  try {
    const result = spawnSync(editor, [summaryFile], { stdio: 'inherit' });
    if (result.error) {
      throw result.error;
    }
    if (options.json) {
      console.log(JSON.stringify({ status: 'ok', edited: summaryFile }));
    } else {
      console.log(`✅ Edited ${options.entity}`);
    }
    return 0;
  } catch {
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message: 'Editor exited with error.' }));
    } else {
      console.error('Editor exited with error.');
    }
    return 1;
  }
}
