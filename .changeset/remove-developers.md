---
"@better-vibe/memo": major
---

Remove `developers` entity type from the product

**Breaking Change:** The `developers` entity type has been completely removed from memo.

**What Changed:**
- Entity types reduced from 4 to 3: `projects`, `libraries`, `patterns`
- Removed `developers` from all code, tests, documentation, and prompts
- Removed `dev` abbreviation from ID generation
- Updated all examples and references

**Files Modified:**
- `src/core/entity.ts` - Removed from ENTITY_TYPES
- `src/core/facts.ts` - Removed `dev` abbreviation
- `src/core/validation.ts` - Removed from enum
- `src/core/*.test.ts` - Updated tests
- `src/commands/help-agent.ts` - Updated examples
- `src/prompts/*.md` - Removed all developers mentions
- `docs/**/*.md` - Removed developers sections and examples

**Migration:**
If you have existing `developers` entities in your memory graph:
1. Export your data: `memo export --output backup.json`
2. Manually migrate developer facts to appropriate projects or patterns
3. Remove the `memory/graph/developers/` directory
4. Re-import: `memo import --input backup.json`

**Rationale:**
Developer information is better tracked at the project level rather than as separate entities. This simplifies the mental model and reduces complexity for AI agents using the system.
