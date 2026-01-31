---
"@better-vibe/memo": minor
---

Enhanced validation, dry-run preview, and error feedback

**New Features:**

1. **Detailed Validation Errors**
   - Field-level error reporting with specific path
   - "Did you mean?" suggestions for typos in category/entityType
   - Shows allowed values for enum fields
   - Returns fact index to identify which fact failed

2. **Enhanced Dry-Run Mode**
   - Shows which entities would be created vs updated
   - Lists new facts and superseded facts per entity
   - Auto-detects relationship links from fact text
   - JSON and human-readable output formats

3. **Relationship Link Detection**
   - Parses fact text for patterns like "Uses X", "Implements Y"
   - Suggests links between entities in dry-run preview
   - Foundation for Phase 3 automatic linking

**Example Usage:**
```bash
# Get detailed validation errors
memo extract < invalid-facts.json
# Output shows: "Did you mean 'projects'?" for "project" typo

# Preview changes before applying
memo extract --dry-run --verbose < facts.json
# Output shows: Would create 2 entities, update 1, create 3 links
```

**Breaking Changes:**
- Validation error response format changed to include structured error objects
- Dry-run output format enhanced with detailed operations preview

**Technical Changes:**
- Added `validateExtractionProposalsDetailed()` function
- New types: `ValidationError`, `ValidationResult`
- Enhanced `extract.ts` with link detection heuristics
- Exported new validation functions in public API
