---
"@better-vibe/memo": patch
---

Add help and version commands

**New Commands:**

1. **`memo help`** - Show comprehensive help information
   - Lists all available commands with descriptions
   - Shows global options
   - Provides usage examples
   - Supports `memo help <command>` for detailed command help

2. **`memo version`** - Show version information
   - Displays package name, version, and description
   - Supports `--json` flag for machine-readable output
   - Shows Node.js version and platform information in JSON mode

**Features:**
- `memo help` - Shows full help text with all commands and examples
- `memo help <command>` - Shows detailed help for specific command
- `memo version` - Human-readable version output
- `memo version --json` - JSON output with additional metadata
- Both commands support `--json` flag for programmatic use

**Examples:**
```bash
# Show full help
memo help

# Show help for specific command
memo help init
memo help extract

# Show version
memo version

# Show version as JSON
memo version --json
```

**Help Content Includes:**
- Usage syntax
- All commands with descriptions
- Global options
- Practical examples
- Command-specific help with options and descriptions

**Note:** The `--version` and `--help` flags (e.g., `memo --version`) continue to work via Commander.js. The new `version` and `help` commands provide additional functionality and more detailed output.
