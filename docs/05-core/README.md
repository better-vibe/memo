# Core Engine

The core engine implements the three-layer memory system. It consists of five modules:

```
src/core/
├── graph.ts       # MemoryGraph class - main API
├── entity.ts      # Entity operations
├── facts.ts       # Fact CRUD and utilities
├── audit.ts       # Audit logging
└── validation.ts  # Schema validation (Zod)
```

## MemoryGraph Class

The main interface for interacting with the knowledge graph.

### Initialization

```typescript
const graph = new MemoryGraph('/path/to/project');

if (!graph.isInitialized()) {
  graph.initialize();
}
```

Creates directory structure:
```
memory/
├── graph/
│   ├── projects/
│   ├── libraries/
│   └── patterns/
└── _meta/
```

### Entity Operations

```typescript
// Create entity
const slug = graph.createEntity('projects', 'My Project', 'Description');

// Check existence
const exists = graph.entityExists('projects', 'my-project');

// List all entities
const all = graph.listEntities();
const projects = graph.listEntities('projects');

// Read facts
const facts = graph.readFacts('projects', 'my-project');
const activeFacts = graph.getActiveFacts('projects', 'my-project');
```

### Summary Operations

```typescript
// Read summary
const summary = graph.readSummary('projects', 'my-project');

// Write summary
graph.writeSummary('projects', 'my-project', '# New Summary\n\nContent...');
```

### Adding Facts

```typescript
const proposals = [
  {
    entityType: 'projects',
    entityName: 'My Project',
    fact: 'Uses TypeScript 5.9',
    category: 'dependency',
    timestamp: '2026-01-30',
    source: 'package.json',
    confidence: 1.0
  }
];

const result = graph.addFacts(proposals, 'manual-entry');
// Returns: { factsAdded, entitiesUpdated, factsSuperseded }
```

Features:
- Auto-creates entities if missing
- Handles deduplication (exact and fuzzy via Jaccard similarity)
- Detects contradictions
- Marks superseded facts
- Auto-detects relationship links from fact text
- Creates bidirectional reverse links
- Appends to audit log

### Verification

```typescript
const { valid, errors, warnings } = graph.verify();
```

Checks:
- Valid JSON in items.json
- No duplicate fact IDs
- Superseded facts link to valid IDs
- Summary files exist
- Active facts past their `expiresAt` date (warning)
- Near-duplicate active facts above 80% Jaccard similarity (warning)

## Entity Module

Low-level entity operations.

### Functions

```typescript
// Slug generation
slugify('My Project'); // 'my-project'

// Path utilities
entityPath(graphRoot, 'projects', 'my-project');
summaryPath(graphRoot, 'projects', 'my-project');
itemsPath(graphRoot, 'projects', 'my-project');

// CRUD
entityExists(graphRoot, 'projects', 'my-project');
createEntity(graphRoot, 'projects', 'my-project', 'My Project', 'Desc');
listEntities(graphRoot, 'projects');

// Caching
resolveEntitySlug(graphRoot, 'projects', 'My Project');
updateEntityCache(metaRoot, 'My Project', 'my-project');
```

## Facts Module

Atomic file operations and fact utilities.

### Atomic Writes

All writes use temp-file + rename pattern:

```typescript
atomicWriteJSON('/path/to/file.json', data);
atomicWriteText('/path/to/file.md', 'content');
```

Process:
1. Generate temp filename with pid, timestamp, random
2. Write content to temp file
3. Rename to target (atomic operation)
4. On error: clean up temp file

### Fact Operations

```typescript
// Read/write
const facts = readFacts('/path/to/items.json');
writeFacts('/path/to/items.json', facts);

// Utilities
generateId('prj', 'my-project', facts);      // Generate unique ID
entityTypeAbbr('projects');                  // 'prj'
isDuplicate(facts, 'Uses TypeScript');       // Check for exact + fuzzy duplicates
isDuplicate(facts, 'Uses TypeScript', 0.9);  // Custom similarity threshold
findContradictions(facts, 'dependency', 'Uses React 18');
supersedeFact(facts, 'prj-myproject-001', 'prj-myproject-002');
getActiveFacts(facts);                       // Filter active only
jaccardSimilarity('Uses React 18', 'Uses React v18'); // Word-level similarity (0-1)

// Link detection
detectLinksFromFact('Uses React for frontend');  // Auto-detect entity links
createReverseLink(graphRoot, 'projects', 'my-app', link, factId); // Bidirectional
```

## Audit Module

Immutable operation logging.

```typescript
appendAudit(metaRoot, {
  operation: 'extract',
  source: 'stdin',
  entitiesAffected: ['projects/my-project'],
  factsAdded: 3,
  factsSuperseded: 1,
  status: 'ok'
});
```

Writes to `memory/_meta/audit.json`.

## Validation Module

Zod schemas for runtime validation.

### Schemas

```typescript
FactItemSchema           // Individual fact
FactItemsArraySchema     // Array of facts
ExtractionProposalSchema // Fact proposal
AuditEntrySchema         // Audit log entry
```

### Types

```typescript
type FactItem = z.infer<typeof FactItemSchema>;
type FactCategory = z.infer<typeof FactCategoryEnum>;
type ExtractionProposal = z.infer<typeof ExtractionProposalSchema>;
type AuditEntry = z.infer<typeof AuditEntrySchema>;
```

### Validation Functions

```typescript
validateFacts(data);              // Validate items.json
validateExtractionProposals(data); // Validate proposals
```

## Data Flow

```
Input → Extract Proposals → Validate → MemoryGraph.addFacts()
                                           ↓
                    ┌──────────────────────┼──────────────────────┐
                    ↓                      ↓                      ↓
              Auto-create       Check duplicates (exact    Detect contradictions
              entities          + fuzzy Jaccard)                ↓
                    ↓                      ↓              Supersede old
                    └──────────────────────┼──────────────────────┘
                                           ↓
                                    Auto-detect links
                                           ↓
                                    Create reverse links
                                           ↓
                                    Write items.json
                                           ↓
                                    Append audit log
                                           ↓
                                    Return results
```

## Error Handling

- **Validation errors** — Invalid JSON schema, caught by Zod
- **File system errors** — Permissions, disk full, etc.
- **Consistency errors** — Duplicate IDs, broken superseded links

All operations are atomic, so partial writes are impossible.

## Next Steps

- [CLI Reference](../06-cli) — Commands that use the core engine
- [Development](../10-development) — Testing and contributing
