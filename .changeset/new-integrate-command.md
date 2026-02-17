---
"@better-vibe/memo": minor
---

Add `memo integrate` command for AI agent config generation

- New `memo integrate` command replaces `--agent` flag on init
- Generates modern Cursor rules format (.cursor/rules/memo.mdc with YAML frontmatter)
- Auto-runs `memo init` if memory graph not initialized
- Positional arguments instead of flags (e.g., `memo integrate cursor`)
- Generates both CLAUDE.md and .cursor/rules/memo.mdc formats
- Updated documentation and help text

