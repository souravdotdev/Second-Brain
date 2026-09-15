# Architecture

## Monorepo layout

Managed with [pnpm workspaces](https://pnpm.io/workspaces) + [Turborepo](https://turborepo.com). Two top-level groups:

```
apps/
  web/      Next.js frontend (feed + save-a-link pages)
  api/      Fastify ingestion API
  worker/   BullMQ consumer that processes saved items

packages/
  core/               Use cases + port interfaces (the Clean Architecture application layer)
  db/                 Drizzle ORM schema, Postgres client, and the ItemRepository adapter
  queue/              BullMQ setup and the ItemQueue adapter
  types/              Shared domain entities (Item, Tag, Collection, Reminder, ...)
  ui/                 Shared React components
  eslint-config/      Shared flat ESLint configs
  typescript-config/  Shared tsconfig bases
```

`apps/*` are deployable units — each one runs as its own process. `packages/*` are internal, unpublished libraries consumed via pnpm's `workspace:*` protocol and scoped under `@second-brain/*`. Apps stay unscoped (`web`, `api`, `worker`) since nothing else depends on them.

Internal packages use **Just-in-Time (JIT) compilation** — they export TypeScript source directly (see each package's `exports` field in `package.json`), and the consuming app's bundler (Next.js) or runtime (`tsx`) compiles it on the fly. No build step is needed to consume `@second-brain/db` from `apps/api`, for example. The tradeoff: these packages aren't independently cached by Turborepo the way `apps/api`'s own `build` task is — only `apps/api` and `apps/worker` have real `build` scripts (`tsc` → `dist/`), since they're the things that actually get deployed.

## Why this split

- **`packages/types`** has zero dependencies and is imported by both the frontend and backend, so request/response shapes for the paste-a-link flow can't drift out of sync between `apps/web` and `apps/api`.
- **`packages/core`** holds the actual business logic (use cases) and the port interfaces infrastructure must implement — it depends only on `packages/types`, never on Drizzle, BullMQ, or Fastify. See [Clean Architecture](./clean-architecture.md) for the full layering.
- **`packages/queue`** exists so the job payload shape (`ProcessItemJob`, defined in `packages/core`) and queue name constants are defined once and shared between the producer (`apps/api`, which enqueues) and the consumer (`apps/worker`, which processes) — a mismatch there would fail silently at runtime otherwise.
- **`packages/db`** centralizes the Drizzle schema so both `apps/api` and `apps/worker` query the same tables through the same typed client, rather than each maintaining its own connection/schema.

## Tech stack

**Language & runtime**: TypeScript, Node.js ≥20

**Package management & orchestration**: pnpm (workspaces), Turborepo

**Frontend** (`apps/web`): Next.js (App Router, Turbopack dev server), React, React DOM

**Backend API** (`apps/api`): Fastify, `@fastify/cors`, Zod (validation), `tsx` (dev/build runtime)

**Worker** (`apps/worker`): BullMQ, `tsx`

**Dependency injection** (`apps/api`, `apps/worker`, and the concrete adapters in `packages/db`/`packages/queue`): InversifyJS + `reflect-metadata` — see [Clean Architecture](./clean-architecture.md#the-composition-root)

**Database** (`packages/db`): Drizzle ORM, drizzle-kit (migrations/studio CLI), `postgres` (postgres.js driver), PostgreSQL 16 (Docker)

**Queue** (`packages/queue`): BullMQ, ioredis, Redis 7 (Docker)

**Linting**: ESLint 9 (flat config), `typescript-eslint`, `eslint-config-next`, `eslint-config-prettier`

**Formatting**: Prettier 3

**Local infra**: Docker Compose (Postgres + Redis)

See [Code Quality](./code-quality.md) for how lint/format/type-check are wired together, and [Getting Started](./getting-started.md) for running everything locally.

## Architectural pattern

This project follows **Clean Architecture** (ports-and-adapters), strictly and as a standing convention for every future change — not just the current code. Dependencies point inward only: infrastructure (Fastify routes, Drizzle, BullMQ) depends on the use-case layer, never the reverse. See [Clean Architecture](./clean-architecture.md) for the full layer breakdown, the dependency rule, and where new code should go.

This wasn't the original design — the project started with routes calling Drizzle/BullMQ directly, a deliberate simplification for early v1 scope. It was refactored to full Clean Architecture once the project's direction called for stricter discipline. `packages/core` holds the business logic and port interfaces; `packages/db` and `packages/queue` provide concrete adapters; `apps/api` and `apps/worker` each have a `src/composition.ts` composition root that wires concrete adapters into the use cases, and their route handlers / job processors are thin controllers that only call use cases.
