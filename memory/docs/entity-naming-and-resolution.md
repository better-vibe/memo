# Entity Naming & Resolution

## Entity Types (Initial)
- `projects` (codebases, repositories, systems)
- `libraries` (packages, frameworks, tools, dependencies)
- `patterns` (architectural patterns, coding patterns, design patterns)

(Extend later: services, databases, APIs, etc.)

## Slug Rules
Convert entity name to folder slug:
- lowercase
- trim whitespace
- replace spaces/underscores with `-`
- remove characters except a–z, 0–9, and `-`
- collapse multiple `-`

Examples:
- "React" → "react"
- "PostgreSQL Database" → "postgresql-database"
- "API Backend" → "api-backend"
- "MVC Pattern" → "mvc-pattern"

## Disambiguation
If multiple entities share the same name:
- Create distinct slugs with context:
  - `project-web-app` vs `project-mobile-app`
  - `lib-lodash-utils` vs `lib-lodash-fp`
- Add disambiguation context to `summary.md` first line.

## Creating a New Entity
When a fact references an unknown entity:
1. Create folder `~/memory/graph/<type>/<slug>/`
2. Create `summary.md` with:
   - Title `# <Display Name>`
   - One-line descriptor (role, purpose, status, etc.)
   - `Last updated: YYYY-MM-DD`
3. Create `items.json` as `[]`

## Entity Linking (Optional but Recommended)
Lightweight cross-references in summaries:
- Project summary can list key libraries
- Library summary can list projects using it
- Pattern summary can list projects applying it

Links should be human-readable slugs; no database required.