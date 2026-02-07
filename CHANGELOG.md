# @better-vibe/memo

## 1.3.0

### Minor Changes

- fb62391: add context command

## 1.2.1

### Patch Changes

- 9fe571b: Add comprehensive README focused on AI workflow improvements

  **Documentation:**

  Added a comprehensive README.md (401 lines) that focuses on the primary value proposition: **improving AI agent workflows**.

  **README Highlights:**

  1. **Clear Value Proposition** — Opens with the context loss problem when working with AI agents
  2. **Three-Layer System Explanation** — Visual structure showing Knowledge Graph, Decisions, and Agent Rules
  3. **AI Workflow Examples** — Before/after scenarios demonstrating real impact
  4. **Draft Command Spotlight** — Dedicated section on the AI agent workflow feature
  5. **Complete Usage Examples** — From initialization to querying with JSON snippets
  6. **Professional Formatting** — Proper markdown with code blocks and clear hierarchy
  7. **Why It Matters Section** — Quantifies the value proposition

  **Key Sections:**

  - Why Memo Exists (AI context loss problem)
  - The Three-Layer Memory System
  - Quick Start Guide
  - AI Agent Workflow (featuring draft command)
  - Installation & Usage
  - Fact Schema Documentation
  - Query Examples
  - Best Practices for AI Agents

  **Target Audience:** Developers building AI-powered tools or working with AI agents regularly.

  The README is designed to be compelling and immediately show the value of using memo for AI-assisted development workflows.

## 1.3.0

### Minor Changes

- AI agent workflow improvements: context command, fuzzy deduplication, expiry detection, tag filtering, enriched status

  **New Features:**

  1. **`memo context` command** — AI-optimized context dump for session startup

     - Generates compact, ranked overview of the knowledge graph
     - Facts ranked by confidence (highest first), then recency
     - Expired facts automatically excluded
     - `--compact` mode for dense output, `--max-facts` to limit per entity
     - `--include-decisions` / `--include-agents` to include layer 2/3
     - JSON and human-readable output formats

  2. **Fuzzy deduplication** — Near-duplicate fact detection

     - `jaccardSimilarity()` function for word-level similarity scoring
     - `isDuplicate()` now detects near-duplicates at 85% threshold
     - Prevents graph bloat from rephrased facts across sessions
     - `verify` warns about active facts with >80% similarity

  3. **Expired fact detection** — Enforcement of `expiresAt` field

     - `verify` warns about active facts past their expiration date
     - `query --exclude-expired` filters out expired facts
     - `context` excludes expired facts automatically

  4. **Tag-based querying** — Filter facts by tags

     - `query --tag <tags>` with comma-separated AND logic
     - Enables filtering by tags like "blocking", "security", "high-priority"

  5. **Enriched status statistics** — Detailed graph breakdown
     - `status --detailed` shows entity type counts, category distribution, link stats
     - Expired fact count reported
     - Relationship breakdown by relation type

  **Files Added:**

  - `src/commands/context.ts` — Context command implementation
  - `src/core/context.test.ts` — Tests for new features

  **Files Modified:**

  - `src/core/facts.ts` — Added `jaccardSimilarity()`, updated `isDuplicate()` with fuzzy matching
  - `src/core/graph.ts` — Enhanced `verify()` with expiry and near-duplicate checks
  - `src/commands/query.ts` — Added `--tag` and `--exclude-expired` filters
  - `src/commands/status.ts` — Added `--detailed` flag with category/link breakdowns
  - `src/cli.ts` — Registered context command, new query and status options
  - `src/index.ts` — Exported `contextCommand` and `jaccardSimilarity`

  **Documentation Updated:**

  - All 10 documentation sections updated to reflect new features
  - Removed stale references to `search` command and `developers` entity type
  - Added documentation for `query`, `draft`, `context`, `help`, `sync-docs` commands

  **Verification:**

  - All tests pass
  - TypeScript strict mode: clean

## 1.2.0

### Minor Changes

- ae42980: publish version

## 2.0.0

### Major Changes

- 70aaca1: Remove legacy search command and version subcommand

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

### Patch Changes

- 70aaca1: Add help and version commands

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

## 1.0.0

### Major Changes

- cbc1d57: Remove `developers` entity type from the product

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

### Minor Changes

- 8e7d067: Draft accumulation API for AI agent workflow

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

- 8e7d067: Enhanced validation, dry-run preview, and error feedback

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

- cbc1d57: Integrate AI agent prompts into memory system

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

- 8e7d067: Query command with advanced filtering and search

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

- 8e7d067: Relationship linking system and enhanced view

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

### Patch Changes

- 42a86fe: Added comprehensive documentation following 10-section structure

  - 01-product: Product overview and features
  - 02-architecture: Three-layer memory system architecture
  - 03-core-concepts: Facts, entities, contradictions
  - 04-entity-types: Projects, libraries, patterns
  - 05-core: Core engine internals (MemoryGraph, entities, facts)
  - 06-cli: CLI commands reference
  - 07-configuration: Setup, AGENTS.md, DECISIONS.md
  - 08-output: JSON formats and file structures
  - 09-caching: Entity cache and audit logs
  - 10-development: Development guide

- 42851e6: Add GitHub Actions workflows for CI and publishing

  **New Workflows:**

  1. **CI Workflow** (`.github/workflows/ci.yml`)

     - Triggers on PRs to `main` and `develop` branches
     - Runs typecheck (`bun run lint`)
     - Runs unit tests (`bun test`)
     - Builds the package (`bun run build`)

  2. **Publish to GitHub Packages** (`.github/workflows/publish-to-github.yml`)

     - Triggers on pushes to `develop` branch
     - Checks for changesets and only publishes if present
     - Versions packages using changesets
     - Creates git tags
     - Publishes to GitHub Packages registry (`npm.pkg.github.com`)
     - Builds standalone executables for multiple platforms:
       - Linux x64 and ARM64
       - macOS x64 and ARM64 (Apple Silicon)
       - Windows x64
     - Creates GitHub Release with binaries

  3. **Publish to npm** (`.github/workflows/publish-to-npm.yml`)
     - Manual trigger via `workflow_dispatch`
     - Supports dry-run mode for testing
     - Merges `develop` into `main` before publishing
     - Publishes to public npm registry
     - Requires `NPM_TOKEN` secret

  **Setup Required:**

  1. Add `NPM_TOKEN` secret to GitHub repository settings for npm publishing
  2. Ensure GitHub Packages is enabled for the repository
  3. Make sure `main` and `develop` branches are protected

  **Benefits:**

  - Automated CI on every PR
  - Automated versioning and tagging
  - Multi-platform binary releases
  - Separate private (GitHub) and public (npm) registries
  - No manual version bumping needed

- 8e7d067: Improved slug handling for org prefixes and display names

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
