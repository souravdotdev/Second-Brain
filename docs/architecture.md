# Architecture

## Monorepo layout

Managed with [pnpm workspaces](https://pnpm.io/workspaces) + [Turborepo](https://turborepo.com). Two top-level groups:

```
apps/
  web/      Next.js frontend (feed + save-a-link pages)
  api/      Fastify ingestion API
  worker/   BullMQ consumer that processes saved items

packages/
  db/                 Drizzle ORM schema + Postgres client
  queue/              Shared BullMQ queue/job-type definitions
  types/              Shared domain types (Item, Tag, Collection, Reminder, ...)
  ui/                 Shared React components
  eslint-config/      Shared flat ESLint configs
  typescript-config/  Shared tsconfig bases
```

`apps/*` are deployable units — each one runs as its own process. `packages/*` are internal, unpublished libraries consumed via pnpm's `workspace:*` protocol and scoped under `@second-brain/*`. Apps stay unscoped (`web`, `api`, `worker`) since nothing else depends on them.

Internal packages use **Just-in-Time (JIT) compilation** — they export TypeScript source directly (see each package's `exports` field in `package.json`), and the consuming app's bundler (Next.js) or runtime (`tsx`) compiles it on the fly. No build step is needed to consume `@second-brain/db` from `apps/api`, for example. The tradeoff: these packages aren't independently cached by Turborepo the way `apps/api`'s own `build` task is — only `apps/api` and `apps/worker` have real `build` scripts (`tsc` → `dist/`), since they're the things that actually get deployed.

## Why this split

- **`packages/types`** has zero dependencies and is imported by both the frontend and backend, so request/response shapes for the paste-a-link flow can't drift out of sync between `apps/web` and `apps/api`.
- **`packages/queue`** exists so the job payload shape (`ProcessItemJob`) and queue name constants are defined once and shared between the producer (`apps/api`, which enqueues) and the consumer (`apps/worker`, which processes) — a mismatch there would fail silently at runtime otherwise.
- **`packages/db`** centralizes the Drizzle schema so both `apps/api` and `apps/worker` query the same tables through the same typed client, rather than each maintaining its own connection/schema.

## Tech stack

**Language & runtime**: TypeScript, Node.js ≥20

**Package management & orchestration**: pnpm (workspaces), Turborepo

**Frontend** (`apps/web`): Next.js (App Router, Turbopack dev server), React, React DOM

**Backend API** (`apps/api`): Fastify, `@fastify/cors`, Zod (validation), Drizzle ORM, `tsx` (dev/build runtime)

**Worker** (`apps/worker`): BullMQ, Drizzle ORM, `tsx`

**Database** (`packages/db`): Drizzle ORM, drizzle-kit (migrations/studio CLI), `postgres` (postgres.js driver), PostgreSQL 16 (Docker)

**Queue** (`packages/queue`): BullMQ, ioredis, Redis 7 (Docker)

**Linting**: ESLint 9 (flat config), `typescript-eslint`, `eslint-config-next`, `eslint-config-prettier`

**Formatting**: Prettier 3

**Local infra**: Docker Compose (Postgres + Redis)

See [Code Quality](./code-quality.md) for how lint/format/type-check are wired together, and [Getting Started](./getting-started.md) for running everything locally.

## Architectural pattern

This is **not** Clean Architecture / ports-and-adapters. It's pragmatic layering by _deployable unit_ (apps) and _shared concern_ (packages) — not a strict dependency-inversion structure within each app.

Concretely: in `apps/api/src/routes/items.ts`, the route handler imports the Drizzle `db` client and the BullMQ queue directly and uses them inline. There's no repository interface, no use-case/interactor layer, and no dependency injection — the HTTP layer is directly coupled to the persistence and queue infrastructure.

This is a deliberate tradeoff for the project's current size (three small services, single developer, v1 MVP scope per the product plan). Clean Architecture's indirection pays for itself when infrastructure is expected to change (e.g. swapping Drizzle for something else) or when business logic needs heavy isolated unit testing — neither applies yet. If routes start accumulating real business logic that gets tangled with HTTP/DB concerns as features grow, that's the signal to introduce a thin use-case layer between routes and `@second-brain/db` — not before.
