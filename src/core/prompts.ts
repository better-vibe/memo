import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Find the prompts source directory by checking multiple possible locations
 * This handles both development (src/) and production (dist/) scenarios
 */
function findPromptsDir(): string | null {
  // Get the directory of the current module file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Possible locations to check, in order of preference
  const possiblePaths = [
    // From src/core/prompts.ts -> src/prompts/ (development)
    path.resolve(__dirname, '..', 'prompts'),
    // From dist/core/prompts.js -> src/prompts/ (built, running from dist/)
    path.resolve(__dirname, '..', '..', 'src', 'prompts'),
    // From dist/cli.js -> src/prompts/ (built, running from dist/ root)
    path.resolve(__dirname, '..', 'src', 'prompts'),
    // Package root prompts/ (alternative location)
    path.resolve(__dirname, '..', '..', 'prompts'),
    path.resolve(__dirname, '..', 'prompts'),
  ];
  
  for (const promptsPath of possiblePaths) {
    if (fs.existsSync(promptsPath)) {
      // Verify it's actually a directory with .md files
      try {
        const files = fs.readdirSync(promptsPath);
        if (files.some(f => f.endsWith('.md'))) {
          return promptsPath;
        }
      } catch {
        // Continue to next path
      }
    }
  }
  
  return null;
}

/**
 * Get the path to the prompts source directory (src/prompts/)
 * Throws error if not found
 */
export function getPromptsSourceDir(): string {
  const promptsDir = findPromptsDir();
  if (!promptsDir) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    throw new Error(
      `Cannot find prompts directory. Looked in:\n` +
      `  - ${path.resolve(__dirname, '..', 'prompts')}\n` +
      `  - ${path.resolve(__dirname, '..', '..', 'src', 'prompts')}\n` +
      `  - ${path.resolve(__dirname, '..', 'src', 'prompts')}\n` +
      `Ensure src/prompts/ exists with .md files.`
    );
  }
  return promptsDir;
}

/**
 * Get the path to the docs directory in a project's memory folder
 */
export function getProjectDocsDir(projectRoot: string): string {
  return path.join(projectRoot, 'memory', 'docs');
}

/**
 * List all available prompt files
 */
export function listPrompts(): string[] {
  try {
    const promptsDir = getPromptsSourceDir();
    return fs.readdirSync(promptsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
  } catch {
    return [];
  }
}

/**
 * Load a prompt file by name
 */
export function loadPrompt(name: string): string | null {
  try {
    const promptsDir = getPromptsSourceDir();
    const promptPath = path.join(promptsDir, `${name}.md`);
    
    if (!fs.existsSync(promptPath)) {
      return null;
    }
    
    return fs.readFileSync(promptPath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Copy all prompts to the project's memory/docs/ directory
 */
export function copyPromptsToProject(projectRoot: string): { copied: number; errors: string[] } {
  const result = { copied: 0, errors: [] as string[] };
  
  let promptsDir: string;
  try {
    promptsDir = getPromptsSourceDir();
  } catch (err: any) {
    result.errors.push(err.message);
    return result;
  }
  
  const docsDir = getProjectDocsDir(projectRoot);
  
  // Create docs directory
  fs.mkdirSync(docsDir, { recursive: true });
  
  // Copy all .md files
  const files = fs.readdirSync(promptsDir).filter(f => f.endsWith('.md'));
  
  for (const file of files) {
    try {
      const srcPath = path.join(promptsDir, file);
      const destPath = path.join(docsDir, file);
      fs.copyFileSync(srcPath, destPath);
      result.copied++;
    } catch (err: any) {
      result.errors.push(`Failed to copy ${file}: ${err.message}`);
    }
  }
  
  return result;
}
