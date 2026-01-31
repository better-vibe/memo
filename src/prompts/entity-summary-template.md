# Entity Summary Template (summary.md)

## File Purpose
`summary.md` for each entity is a lean snapshot of current state.
Loaded by default during context retrieval.

## Template Structure
```markdown
### Projects
# <Project Name>

**Status:** active | archived | in-progress | paused
**Owner:** <developer slug or team>
**Tech Stack:** <key tech, comma-separated>

## Current State
<brief description of what it is and its role>

## Key Dependencies
- <library slug> v<version> — reason or constraint
- <library slug> v<version>

## Constraints & Known Issues
- <constraint or tech debt, e.g., "Not compatible with React 19">
- <known bug or limitation>

Last updated: YYYY-MM-DD
```