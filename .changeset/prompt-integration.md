---
"@better-vibe/memo": minor
---

Integrate AI agent prompts into memory system

**New Features:**
- `memo init` now copies AI agent documentation to `memory/docs/` folder
- New `memo sync-docs` command to re-sync documentation after memo updates
- Enhanced `memo help-agent` with `--list-docs` and `--show-doc <name>` flags

**Documentation Integration:**
All AI agent guidance files are now automatically copied into each project's memory folder:
- `three-layer-memory-system.md` - Complete system overview and invariants
- `extract.md` - Fact extraction format and examples
- `synthesize.md` - Summary rewriting guidelines
- `facts-item-schema.md` - JSON schema documentation
- `agents.md` - Operating rules for AI agents
- `decisions.md` - Decision log format
- `entity-naming-and-resolution.md` - Entity conventions
- `entity-summary-template.md` - Summary templates

**Benefits:**
- AI agents have complete documentation within project context
- Self-contained memory system - no external references needed
- Version-pinned documentation per project
- Easy to discover and reference programmatically

**Technical Changes:**
- New `src/core/prompts.ts` module for prompt management
- Updated `init.ts` to copy prompts during initialization
- New `sync-docs.ts` command for documentation synchronization
- Enhanced `help-agent.ts` with documentation browsing features
- Package.json includes `src/prompts/` in published files
