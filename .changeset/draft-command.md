---
"@better-vibe/memo": minor
---

Draft accumulation API for AI agent workflow

**New Feature: `memo draft` Command**

Implements the draft accumulation feature requested in AGENTS.md to solve the AI agent context switching problem.

**Commands:**

1. **`memo draft --add "fact text"`**
   - Queue a fact for later extraction without breaking coding flow
   - Auto-infers entity type, entity name, and category from text
   - Shows inferred metadata for verification

2. **`memo draft --list`**
   - Display all queued drafts
   - Shows inferred entity mapping for each draft
   - Review before flushing

3. **`memo draft --flush`**
   - Extract all queued drafts to knowledge graph
   - Converts drafts to proper extraction proposals
   - Auto-detects links from fact text
   - Clears queue after successful extraction

4. **`memo draft --clear`**
   - Clear draft queue without extracting
   - Useful for discarding draft ideas

**Storage:**
- Drafts stored in `memory/_meta/draft.json`
- Preserved across sessions until flushed or cleared
- JSON format with metadata

**Auto-Inference:**
The command automatically infers:
- **Entity Type:** Based on keywords (project, library, pattern)
- **Entity Name:** Extracted from patterns like "X uses Y", "X implements Y"
- **Category:** Based on keywords (dependency, version, constraint, architecture, etc.)
- **Links:** Auto-detected from fact text ("Uses React" → link to libraries/react)

**Example Workflow:**
```bash
# During coding session, quickly capture insights:
memo draft --add "Uses Zod 3.22 for validation"
memo draft --add "Implements atomic file write pattern"
memo draft --add "Migrated from Express to Fastify"

# Review what you've captured:
memo draft --list

# When ready, flush to knowledge graph:
memo draft --flush
# Output: ✅ Flushed 3 fact(s) to knowledge graph
```

**Benefits for AI Agents:**
- No context switching during coding flow
- Quick capture of insights as they occur
- Batch extraction when convenient
- Auto-inference reduces manual work
- Foundation for automatic extraction from code analysis

**Technical Implementation:**
- `src/commands/draft.ts` - Draft command implementation
- `inferFactMetadata()` - Smart inference from text
- `readDrafts()` / `writeDrafts()` - Storage management
- Uses existing `detectLinksFromFact()` for link detection
- Leverages validation and extraction infrastructure

**Addresses Pain Points:**
1. ✓ Context switching overhead eliminated
2. ✓ Draft accumulation for "later" extraction
3. ✓ Reduces manual translation burden (auto-inference)
4. Foundation for proactive suggestions (next phase)

This feature directly implements the "Draft Accumulation API" proposed in AGENTS.md based on self-documented AI agent pain points.
