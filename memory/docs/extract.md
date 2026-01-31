# Extraction Prompt (for Sub-Agent or Inline)

## Instruction
Extract durable technical facts from the provided conversation snippet.
Output ONLY valid JSON (array of fact proposals).
Do not output explanation text.

## Input
- Conversation snippet or transcript
- Current date (ISO format)
- Entity context (if known)

## Output Format (Strict JSON)
Array of fact objects:
```json
[
  {
    "entityType": "projects|libraries|patterns",
    "entityName": "string (as mentioned)",
    "fact": "atomic, specific claim",
    "category": "dependency|version|constraint|architecture|decision|ownership|expertise|bug|tech_debt|rule|status",
    "timestamp": "YYYY-MM-DD",
    "source": "conversation",
    "confidence": 0.0-1.0,
    "evidence": "short quote or paraphrase"
  }
]
```

## Guardrails
- Do not extract secrets (API keys, tokens, passwords).
- If sensitive info is mentioned: store a high-level abstraction and lower confidence.
- If ambiguous (two Alices): emit candidates or note `needsDisambiguation`; do not write until resolved.
- Prefer specificity: include version numbers, file paths, exact constraints.
- Skip ephemeral details: one-off error messages, temporary flags, session-specific state.

## Durable Fact Indicators
Extract facts about:
- **Dependency/Library**: version, stability, known issues, breaking changes
- **Architecture**: design pattern chosen, rationale, constraints
- **Project**: status (active/archived), key milestones, deployment constraints, tech stack
- **Pattern**: when/where it applies, trade-offs, team adoption
- **Constraint**: rule or limitation and why it exists
- **Decision**: significant choice and its rationale
- **Tech Debt**: known issue, effort to fix, priority
- **Rule**: coding standard, linting rule, naming convention

## Example Input
User: "We migrated from Express to Fastify last month. Fastify is much faster for our JSON APIs. We're on v4.25.2 now."
## Example Output
```json
[
  {
    "entityType": "projects",
    "entityName": "API",
    "fact": "Migrated from Express to Fastify.",
    "category": "decision",
    "timestamp": "2025-01-28",
    "source": "conversation",
    "confidence": 0.9,
    "evidence": "User: 'We migrated from Express to Fastify last month.'"
  },
  {
    "entityType": "libraries",
    "entityName": "Fastify",
    "fact": "Version 4.25.2 in use; chosen for speed in JSON APIs.",
    "category": "version",
    "timestamp": "2025-01-28",
    "source": "conversation",
    "confidence": 0.9,
    "evidence": "User: 'Fastify is much faster for our JSON APIs... v4.25.2 now.'"
  }
]