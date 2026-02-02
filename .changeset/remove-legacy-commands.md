---
"@better-vibe/memo": major
---

Remove legacy search command and version subcommand

**Breaking Changes:**

1. **Removed `search` command** - Use `query` command instead
   - `memo search "term"` → `memo query --query "term"`
   - `memo search --category dependency` → `memo query --category dependency`

2. **Removed `version` subcommand** - Use `--version` flag instead
   - `memo version` → `memo --version`
   - `memo version --json` no longer available (use `memo --version` for basic version)

**Rationale:**
- The `query` command provides all functionality of `search` plus advanced features
- The `version` subcommand was redundant with the `--version` flag
- Cleaner CLI with fewer commands to maintain
- Consolidates search/query functionality into one powerful command

**Migration:**
```bash
# Old way (removed)
memo search "fastify"
memo version

# New way
memo query --query "fastify"
memo --version
```

**Files Removed:**
- `src/commands/search.ts`
- `src/commands/version.ts`

**Files Updated:**
- `src/cli.ts` - Removed command registrations
- `src/index.ts` - Removed exports
- `src/commands/help.ts` - Updated help text
- `src/commands/help-agent.ts` - Updated agent guide

**Verification:**
- ✅ Build passes
- ✅ All 24 tests pass
- ✅ Typecheck passes
- ✅ `--version` flag still works
- ✅ `query` command provides all needed functionality
