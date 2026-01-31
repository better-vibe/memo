# Atomic Fact Item Schema (`items.json`)

## File Format
`items.json` is a JSON array of objects.

Example:
[
  {
    "id": "proj-react-001",
    "fact": "React version 18.2.0; using hooks and context API.",
    "category": "dependency",
    "timestamp": "2025-01-28",
    "source": "conversation",
    "status": "active",
    "confidence": 0.9,
    "evidence": "User stated: 'We're on React 18.2.0 with hooks.'"
  },
  {
    "id": "proj-react-002",
    "fact": "React 19.0 upgrade blocked due to incompatible third-party package.",
    "category": "constraint",
    "timestamp": "2025-01-28",
    "source": "conversation",
    "status": "active",
    "confidence": 0.8,
    "evidence": "'react-query-old v5 doesn't support React 19 yet.'"
  }
]

## Fields
Required:
- `id`: string (unique within entity)
- `fact`: string (one atomic claim, specific)
- `category`: enum
  - `dependency` | `version` | `constraint` | `architecture` | `decision` |
    `ownership` | `expertise` | `bug` | `tech_debt` | `rule` | `status`
- `timestamp`: "YYYY-MM-DD"
- `source`: string ("conversation" | "codebase_scan" | "user_confirmed" | etc.)
- `status`: "active" | "superseded"

Optional:
- `supersededBy`: string (id of newer item)
- `confidence`: number 0..1
- `evidence`: short string (quotation or reference)
- `tags`: string[] (optional; e.g., ["security", "blocking"])
- `expiresAt`: "YYYY-MM-DD" (optional; fact may rot after this date)

## Status Transitions
- New facts are written as `active`.
- When replaced/invalidated, set old fact to:
  - `status: "superseded"`
  - `supersededBy: "<new-id>"`

## ID Generation
Deterministic approach, unique per entity. Format:
- `<entity-type-abbr><entity-slug>-NNN` (zero-padded)
- Example: `lib-axios-001`, `proj-api-backend-023`, `dev-alice-007`
- Determine NNN by scanning existing ids and incrementing max

## Deduplication
Before appending a new fact:
- If an active fact with same meaning already exists, do not add a duplicate.
- For version facts, treat minor version changes as updates (supersede the old version).

## Contradiction Handling (Minimum)
If a new fact contradicts an existing active fact:
- Add the new fact as active
- Supersede the contradicted fact (older or lower-confidence)
- Link via `supersededBy`
Never delete. (Example: React 18.2.0 → React 18.3.1 is a version update, so supersede the old version.)