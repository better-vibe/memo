# Technical Decisions (Decision Log)

## Purpose
Capture the "why" behind significant technical choices.
Indexed by decision, not time.

## Format
Each decision is a section with:
- **Decision**: Short title
- **Date Decided**: ISO date (or "ongoing")
- **Rationale**: Why this choice was made
- **Trade-offs**: What was given up
- **Status**: "active" | "superseded" | "under_review"
- **Related Facts**: Links to entity slugs in knowledge graph

## Examples

### React → Vue Migration (Conditional)
- **Date Decided**: 2024-06-15
- **Rationale**: Better template syntax for the team's skill set; easier onboarding for new team members.
- **Trade-offs**: Must rewrite components; less ecosystem support for advanced patterns.
- **Status**: active
- **Related Facts**: projects/web-app

### PostgreSQL Chosen Over MongoDB
- **Date Decided**: 2024-01-20
- **Rationale**: Strong consistency requirements for financial data; better schema validation.
- **Trade-offs**: Slower for unstructured/exploratory queries; vertical scaling limits.
- **Status**: active
- **Related Facts**: projects/backend, libraries/postgresql

### Microservices → Monolith (Partial)
- **Date Decided**: 2024-09-10
- **Rationale**: Operational overhead was too high for team size (2 engineers); monolith reduced deployment complexity.
- **Trade-offs**: Tighter coupling; harder to scale independently. Acceptable for current load.
- **Status**: active
- **Related Facts**: projects/api-backend

## Update Policy
- Add a decision when the agent learns a significant choice was made.
- Mark decisions "superseded" when later choices override them; never delete.
- Keep rationale and trade-offs brief but specific.