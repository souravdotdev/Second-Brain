# Environment Variables

Each app/package that needs configuration has its own local `.env` file — there is deliberately no single root-level `.env` (see [Architecture](./architecture.md) and the "why not one shared file" reasoning below). `.env` is gitignored everywhere; nothing here should ever be committed.

## `packages/db/.env`

| Variable       | Purpose                                     | Local dev value                                              |
| -------------- | ------------------------------------------- | ------------------------------------------------------------ |
| `DATABASE_URL` | Postgres connection string, used by Drizzle | `postgres://postgres:postgres@localhost:5433/universal_save` |

Required for `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:studio`, and any other direct use of `drizzle-kit` in this package.

## `apps/api/.env`

| Variable       | Purpose                                                              | Local dev value                                              |
| -------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `PORT`         | Port the Fastify server listens on                                   | `4000`                                                       |
| `DATABASE_URL` | Postgres connection string (via `@second-brain/db`)                  | `postgres://postgres:postgres@localhost:5433/universal_save` |
| `REDIS_URL`    | Redis connection string (via `@second-brain/queue`, to enqueue jobs) | `redis://localhost:6380`                                     |

## `apps/worker/.env`

| Variable       | Purpose                                                            | Local dev value                                              |
| -------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| `DATABASE_URL` | Postgres connection string, to update item status after processing | `postgres://postgres:postgres@localhost:5433/universal_save` |
| `REDIS_URL`    | Redis connection string, to consume queued jobs                    | `redis://localhost:6380`                                     |

No `PORT` — the worker doesn't expose an HTTP server, it just consumes the queue.

## `apps/web/.env`

| Variable              | Purpose                                           | Local dev value         |
| --------------------- | ------------------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL the frontend calls for the ingestion API | `http://localhost:4000` |

`NEXT_PUBLIC_*`-prefixed variables get inlined into the client-side JS bundle at build time — never put a secret behind that prefix.

## Duplication: `DATABASE_URL` / `REDIS_URL`

`DATABASE_URL` is duplicated across `packages/db`, `apps/api`, and `apps/worker`; `REDIS_URL` across `apps/api` and `apps/worker`. This is real duplication, not an oversight — all three point at the same Docker Compose services.

A single root `.env` was considered and intentionally not adopted, per Turborepo's own guidance against it:

- it creates implicit coupling (unclear which service actually consumes which variable)
- it produces coarse cache invalidation in Turborepo (any variable change would invalidate every task's cache, not just the tasks that actually use that variable)
- it would put `apps/web`'s `NEXT_PUBLIC_*` values (client-bundled) in the same file as database credentials (server-only)

If the duplication becomes painful, the documented middle ground is a single root `.env` for just the genuinely shared infra values (`DATABASE_URL`, `REDIS_URL`), loaded via `dotenv-cli` or Node's native `--env-file`, while `PORT` and `NEXT_PUBLIC_API_URL` stay app-local. Not implemented yet — flag it if you want it done.
