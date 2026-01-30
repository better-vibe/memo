# Entity Types

memo organizes knowledge into four entity types. Each type has specific use cases and conventions.

## Projects

Software projects, repositories, or applications.

### Use Cases

- Track project dependencies
- Document architecture decisions
- Record project status
- Store constraints and requirements

### Examples

```json
{
  "fact": "Frontend built with React 18",
  "category": "architecture"
}
```

```json
{
  "fact": "API rate limit: 1000 req/min",
  "category": "constraint"
}
```

```json
{
  "fact": "In production since 2024-06",
  "category": "status"
}
```

### Storage

```
memory/graph/projects/
├── my-web-app/
│   ├── summary.md
│   └── items.json
├── api-server/
│   ├── summary.md
│   └── items.json
```

## Developers

Team members and their expertise.

### Use Cases

- Track code ownership
- Record expertise areas
- Document responsibilities
- Remember preferences

### Examples

```json
{
  "fact": "Expert in PostgreSQL and database optimization",
  "category": "expertise"
}
```

```json
{
  "fact": "Owns authentication and authorization modules",
  "category": "ownership"
}
```

```json
{
  "fact": "Prefers async/await over callbacks",
  "category": "preference"
}
```

### Storage

```
memory/graph/developers/
├── alice-smith/
│   ├── summary.md
│   └── items.json
├── bob-jones/
│   ├── summary.md
│   └── items.json
```

## Libraries

Dependencies, frameworks, and tools.

### Use Cases

- Track versions
- Document compatibility
- Record configuration
- Note security considerations

### Examples

```json
{
  "fact": "Current version: 5.9.3",
  "category": "version"
}
```

```json
{
  "fact": "Required for type checking in CI",
  "category": "dependency"
}
```

```json
{
  "fact": "tsconfig: strict mode enabled",
  "category": "constraint"
}
```

### Storage

```
memory/graph/libraries/
├── typescript/
│   ├── summary.md
│   └── items.json
├── react/
│   ├── summary.md
│   └── items.json
└── zod/
    ├── summary.md
    └── items.json
```

## Patterns

Reusable patterns, best practices, and conventions.

### Use Cases

- Document code patterns
- Record best practices
- Define conventions
- Share architectural patterns

### Examples

```json
{
  "fact": "Use repository pattern for data access",
  "category": "architecture"
}
```

```json
{
  "fact": "Prefer composition over inheritance",
  "category": "rule"
}
```

```json
{
  "fact": "All API responses must include requestId",
  "category": "constraint"
}
```

### Storage

```
memory/graph/patterns/
├── repository-pattern/
│   ├── summary.md
│   └── items.json
├── error-handling/
│   ├── summary.md
│   └── items.json
└── testing-strategy/
    ├── summary.md
    └── items.json
```

## Cross-References

Entities can reference each other in facts:

```json
{
  "fact": "Uses libraries/typescript for type checking",
  "category": "dependency"
}
```

```json
{
  "fact": "Implemented by developers/alice-smith",
  "category": "ownership"
}
```

## Auto-Creation

When extracting facts, entities are automatically created if they don't exist:

```bash
echo "MyNewProject uses React" | memo extract
# Creates: memory/graph/projects/mynewproject/
```

## Best Practices

1. **Use consistent slugs** — Entity names should be predictable
2. **One concept per entity** — Don't mix different libraries in one entity
3. **Cross-reference liberally** — Link related entities
4. **Keep summaries current** — Synthesize regularly

## Next Steps

- [Core Engine](../05-core) — How entities are managed
- [CLI Reference](../06-cli) — Working with entities
