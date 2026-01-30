# Development

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.1.0+)
- Node.js 18+ (for compatibility)

### Setup

```bash
# Clone repository
git clone https://github.com/better-vibe/memo.git
cd memo

# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build
```

## Project Structure

```
memo/
├── bin/
│   └── memo              # CLI entry point
├── src/
│   ├── cli.ts            # CLI setup and commands
│   ├── index.ts          # Public API exports
│   ├── commands/         # Command implementations
│   │   ├── init.ts
│   │   ├── extract.ts
│   │   ├── synthesize.ts
│   │   ├── view.ts
│   │   ├── search.ts
│   │   ├── edit.ts
│   │   ├── verify.ts
│   │   ├── status.ts
│   │   ├── export.ts
│   │   ├── import.ts
│   │   └── help-agent.ts
│   ├── core/             # Core engine
│   │   ├── graph.ts      # MemoryGraph class
│   │   ├── entity.ts     # Entity operations
│   │   ├── facts.ts      # Fact utilities
│   │   ├── audit.ts      # Audit logging
│   │   └── validation.ts # Zod schemas
│   └── prompts/          # AI prompts
│       ├── extract.md
│       └── synthesize.md
├── docs/                 # Documentation
├── package.json
├── tsconfig.json
└── README.md
```

## Testing

### Run All Tests

```bash
bun test
```

### Run Specific Test

```bash
bun test src/core/facts.test.ts
```

### Test Coverage

Tests cover:
- Entity operations (slugify, CRUD)
- Fact management (add, supersede, dedup)
- Graph consistency (verify)
- Schema validation

### Writing Tests

```typescript
import { describe, it, expect } from 'bun:test';
import { slugify } from '../src/core/entity';

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('My Project')).toBe('my-project');
  });
});
```

## Building

### Development Build

```bash
bun run build
```

Output: `dist/cli.js`

### Production Build

```bash
bun run prepublishOnly
```

## Code Style

### TypeScript

- Strict mode enabled
- Explicit return types on public APIs
- No `any` types

### File Naming

- Commands: `{name}.ts`
- Tests: `{name}.test.ts`
- Utilities: descriptive nouns

### Code Organization

1. **CLI layer** — User interface, argument parsing
2. **Command layer** — Business logic orchestration
3. **Core layer** — Data operations, storage

## Contributing

### Issues

Report bugs or request features via GitHub issues.

### Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Ensure `bun test` passes
5. Submit PR with description

### Code Review

All PRs require:
- Tests for new functionality
- Type checking passes (`bun run lint`)
- No breaking changes (or clearly documented)

## Architecture Decisions

### Why Zod?

Zod provides:
- Runtime validation
- Type inference
- Good error messages
- No decorator overhead

### Why Bun?

Bun offers:
- Fast test runner
- Built-in TypeScript support
- Simple bundling
- npm compatibility

### Why No Database?

File-based storage:
- Works with version control
- Human-readable
- No setup required
- Portable

## Debugging

### Verbose Mode

```bash
memo command --verbose
```

Shows:
- Operation details
- File paths
- Timing

### IDE Setup

**VS Code** `launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug CLI",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "bun",
      "args": ["src/cli.ts", "status", "--verbose"],
      "cwd": "${workspaceFolder}",
      "sourceMaps": true
    }
  ]
}
```

## Performance Profiling

### Benchmarking

```bash
# Time a command
time memo search "test" --json

# Profile with Bun
bun run --inspect src/cli.ts status
```

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run tests: `bun test`
4. Build: `bun run build`
5. Tag: `git tag v0.1.0`
6. Push: `git push origin main --tags`
7. Publish: `npm publish`

## Future Enhancements

- [ ] Search indexing for large graphs
- [ ] Plugin system for custom entity types
- [ ] Web UI for browsing knowledge graph
- [ ] Import from external sources (GitHub, Jira)
- [ ] Query language for complex searches

## Resources

- [Bun Documentation](https://bun.sh/docs)
- [Zod Documentation](https://zod.dev/)
- [Commander.js](https://github.com/tj/commander.js/)

## License

MIT © Better Vibe
