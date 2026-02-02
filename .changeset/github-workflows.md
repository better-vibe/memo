---
"@better-vibe/memo": patch
---

Add GitHub Actions workflows for CI and publishing

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
