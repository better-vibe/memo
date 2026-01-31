---
"@better-vibe/memo": patch
---

Improved slug handling for org prefixes and display names

**Changes:**

1. **Enhanced `slugify()` function**
   - Handles org prefixes: `@org/repo` → `org-repo`
   - Removes `@` prefix but preserves structure with dashes
   - Handles slashes by converting to dashes
   - Example: `@better-vibe/memo` → `better-vibe-memo`

2. **New `formatDisplayName()` function**
   - Preserves org prefixes in display names
   - Keeps original formatting for names with special chars
   - Converts slug-like names to title case
   - Example: `@acme-corp/dashboard` → `@acme-corp/dashboard` (preserved)
   - Example: `my-project` → `My Project`

3. **New `displayNameFromSlug()` function**
   - Converts slugs back to display names
   - Example: `better-vibe-memo` → `Better Vibe Memo`

4. **Updated `createEntity()` in graph.ts**
   - Uses `formatDisplayName()` to preserve org prefixes
   - Display names now correctly show `@org/repo` format

5. **Updated `synthesize` command**
   - Looks up original display names from entity cache
   - Preserves org prefixes in generated summaries
   - Falls back to `displayNameFromSlug()` for unknown entities

**Examples:**
```bash
# Create entity with org prefix
memo extract <<< '[{"entityType": "projects", "entityName": "@acme/dashboard"}]'

# View shows preserved display name
memo view projects/acme-dashboard
# Output: # @acme/dashboard
```

**Benefits:**
- Org prefixes are now preserved in display names
- Better readability for npm-style package names
- Maintains branding in entity references
- Works with existing entity naming conventions
