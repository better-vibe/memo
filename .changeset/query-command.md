---
"@better-vibe/memo": minor
---

Query command with advanced filtering and search

**New Features:**

1. **Query Command**
   - New `memo query` command for powerful fact searching
   - Multiple filter options: entity-type, category, status, source
   - Text search across fact content
   - Evidence field search
   - Related entity queries

2. **Compound Where Clauses**
   - Support for comparison operators: `=`, `>`, `>=`, `<`, `<=`
   - Multiple `--where` flags combine with AND logic
   - Examples:
     - `memo query --where "confidence>0.8"`
     - `memo query --where "category=dependency" --where "confidence>0.9"`

3. **Evidence Search**
   - `--evidence-contains <pattern>` searches evidence fields
   - Regex support for flexible matching
   - Useful for finding facts sourced from specific files

4. **Related Entity Queries**
   - `--related-to <entity>` finds facts from linked entities
   - Traverses relationship graph automatically
   - Example: `memo query --related-to projects/my-app`

5. **Rich JSON Output**
   - Structured results with all fact fields
   - Entity metadata (type, slug, path)
   - Link information included
   - Perfect for programmatic consumption

**Example Usage:**
```bash
# Find all dependency facts
memo query --category dependency

# Find high-confidence facts with evidence
memo query --where "confidence>0.9" --evidence-contains "package.json"

# Find facts related to a specific entity
memo query --related-to projects/my-app --json

# Complex query: dependencies with high confidence
memo query --category dependency --where "confidence>=0.8" --json
```

**Implementation:**
- `src/commands/query.ts` - Query engine with filtering
- `buildFilterFunction()` - Dynamic filter composition
- `parseWhereClause()` - Where clause parser
- `queryRelated()` - Relationship traversal
- Registered in CLI with all filter options

**Benefits for AI Agents:**
- Precise fact retrieval without manual browsing
- Filter by confidence to get high-quality facts
- Evidence search for source verification
- Related entity discovery for context building
- JSON output for integration with AI workflows
