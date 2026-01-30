# Synthesis Prompt

Rewrite the entity summary from active facts.

## Input
- Entity type and slug
- List of active facts from items.json

## Output
A lean markdown summary that:
1. Starts with `# Display Name`
2. Groups facts by category
3. Uses bullet points for each fact
4. Ends with `Last updated: YYYY-MM-DD`

Keep summaries short and scannable. Omit superseded facts.
