# Documentation

Reference docs for the `second-brain` monorepo, covering what's been set up and why.

- [Architecture](./architecture.md) — monorepo layout, tech stack, and the architectural pattern in use
- [Clean Architecture](./clean-architecture.md) — the layering convention (entities/use cases/adapters), strictly enforced, and where new code should go
- [Getting Started](./getting-started.md) — local setup: prerequisites, install, running services
- [Environment Variables](./environment-variables.md) — every variable, which app/package needs it, and why
- [Database](./database.md) — schema, data model, and the Drizzle migration workflow
- [API](./api.md) — HTTP endpoint reference for `apps/api`
- [Queue & Background Jobs](./queue.md) — how item processing is queued and consumed
- [Code Quality](./code-quality.md) — linting, formatting, and type-checking conventions

Each file stands on its own — start with whichever is relevant, or read [Architecture](./architecture.md) first for the full-picture view.
