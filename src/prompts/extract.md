# Extraction Prompt

Extract durable technical facts from the provided conversation snippet.
Output ONLY valid JSON (array of fact proposals). No markdown, no explanation.

## Output Format

```json
[
  {
    "entityType": "projects|developers|libraries|patterns",
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
- Prefer specificity: include version numbers, file paths, exact constraints.
- Skip ephemeral details: one-off error messages, temporary flags.

## Durable Fact Indicators
- Dependency/Library versions, stability, known issues
- Architecture design patterns, rationale, constraints
- Developer expertise, roles, ownership
- Project status, milestones, deployment constraints
- Coding standards, rules, conventions
- Known bugs, tech debt, priorities
