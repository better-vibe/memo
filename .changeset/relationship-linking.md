---
"@better-vibe/memo": minor
---

Relationship linking system and enhanced view

**New Features:**

1. **Relationship Link Schema**
   - Added `Link` type with entityType, slug, and relation
   - Relations: uses, implements, depends_on, extends, references
   - Reverse relations: used_by, implemented_by, depended_on_by, extended_by, referenced_by
   - Links stored in `items.json` alongside facts

2. **Auto-Link Detection**
   - Detects entity references in fact text using heuristics
   - Patterns: "Uses X", "Implements X", "Extends X", "Based on X"
   - Automatically determines entity type (library, pattern, project)
   - Removes duplicate links automatically

3. **Bidirectional Links**
   - Creating a forward link automatically creates reverse link
   - Example: A uses B → B used_by A
   - Reverse links stored as synthetic facts with 'auto-link' source

4. **Enhanced View Command**
   - Now shows rich information by default (no flag needed)
   - Displays evidence field for each fact
   - Shows source, confidence, and tags
   - Separate sections for active and superseded facts
   - Related entities section (placeholder for full Phase 3)

**Schema Changes:**
- `FactItemSchema` now includes optional `links` array
- `ExtractionProposalSchema` supports explicit `links` field
- `LinkSchema` defines valid relation types including reverse relations

**Example:**
```bash
# Extract fact with auto-detected links
echo '[{"entityType": "projects", "entityName": "my-app", "fact": "Uses React", ...}]' | memo extract

# View shows links
memo view projects/my-app
# Output includes: "Category: dependency | Source: analysis | Evidence: package.json"
```

**Implementation:**
- `detectLinksFromFact()` - Heuristic link detection
- `createReverseLink()` - Bidirectional link creation
- Enhanced `view.ts` with rich fact display
- All types exported in public API
