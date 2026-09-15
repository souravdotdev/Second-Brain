# Clean Architecture

This project follows Clean Architecture (ports-and-adapters / the dependency rule) **strictly, as a standing rule for every code change** — not a one-time refactor to admire. Read this before adding or modifying any backend code in `apps/api`, `apps/worker`, or `packages/*`.

## The dependency rule

Source code dependencies point **inward only**. Outer layers depend on inner layers; inner layers know nothing about outer layers.

```
Frameworks & Drivers   (Fastify, BullMQ, Drizzle, Postgres, Redis)
        ↓ depends on
Interface Adapters     (route controllers, repository/queue adapter implementations)
        ↓ depends on
Use Cases              (packages/core/src/use-cases)
        ↓ depends on
Entities                (packages/types)
```

An inner layer never imports from an outer one. Concretely: `packages/core` (use cases) never imports `drizzle-orm`, `bullmq`, or `fastify` — it only knows about the **port interfaces** it defines itself. Outer layers (`packages/db`, `packages/queue`, `apps/api`, `apps/worker`) import `@second-brain/core` to implement those interfaces or call those use cases — never the other way around.

## The layers, mapped to this codebase

### Entities — `packages/types`

Plain domain types with zero dependencies: `Item`, `Tag`, `Collection`, `Reminder`, `User`, plus DTOs like `CreateItemInput`. No framework, no I/O, no business rules beyond shape.

### Use Cases — `packages/core`

The application's actual business logic, and the **ports** (interfaces) it needs from the outside world. This package depends only on `packages/types`.

- `src/ports/*.ts` — interfaces the use-case layer defines and infrastructure must implement: `ItemRepository` (persistence), `ItemQueue` (background jobs), `MetadataFetcher` (URL metadata extraction).
- `src/use-cases/*.ts` — the actual interactors: `saveItem`, `listItems`, `processItem`. Each takes a `deps` object typed against the port interfaces, plus a plain input object, and returns a plain result. No HTTP, no SQL, no queue library — fully unit-testable by passing hand-written fake implementations of the ports.
- `src/lib/detect-item-type.ts` — a pure business rule (inferring item type from a URL). It lives here, not in `apps/api`, because deciding what type a saved link is is a domain concern, not an HTTP concern.

### Interface Adapters — repository/queue implementations + route controllers

Adapters translate between the use-case layer's abstractions and a specific technology:

- **`packages/db`**'s `DrizzleItemRepository` (`src/repositories/item-repository.ts`) implements `ItemRepository` from `@second-brain/core` using Drizzle + Postgres. It's also where infrastructure-shaped data gets translated into domain-shaped data — e.g. Drizzle returns `createdAt` as a native `Date`, but the `Item` entity declares it as `string`; the repository does that conversion so nothing outside `packages/db` ever sees a raw `Date`.
- **`packages/queue`**'s `BullMqItemQueue` (`src/adapters/item-queue.ts`) implements `ItemQueue` using BullMQ.
- **`apps/worker`**'s `StubMetadataFetcher` (`src/adapters/stub-metadata-fetcher.ts`) implements `MetadataFetcher` — currently a placeholder (uses the URL's hostname as the title). This is the seam where real extraction (Open Graph, oEmbed, the YouTube API, PDF text extraction — see the product plan's v2 scope) gets plugged in later, without touching anything else.
- **`apps/api`**'s route handlers (`src/routes/items.ts`) are controllers: they parse/validate the HTTP request (Zod), call a use case, and format the HTTP response. They contain zero business logic and never import Drizzle or BullMQ.
- **`apps/worker`**'s job processor (`src/processors/process-item.ts`) is the equivalent controller for the BullMQ delivery mechanism: it unwraps a `Job`, calls the `processItem` use case, and returns.

### Frameworks & Drivers — the outermost layer

Fastify, BullMQ, Drizzle, Postgres, Redis, Next.js. These are configuration and setup, not business logic — `packages/db/src/client.ts` (the Drizzle client), `packages/db/src/schema.ts` (table definitions), `packages/queue/src/connection.ts` (the Redis connection), `apps/api/src/index.ts` (the Fastify server bootstrap).

## The composition root

Concrete adapters have to get wired into the use cases _somewhere_ — that place is the **composition root**, the one spot in each app allowed to know about every concrete implementation at once.

- `apps/api/src/composition.ts` — instantiates `DrizzleItemRepository` and `BullMqItemQueue`, exports them as a `dependencies` object.
- `apps/worker/src/composition.ts` — instantiates `DrizzleItemRepository` and `StubMetadataFetcher`.

Both `apps/api/src/index.ts` and `apps/worker/src/index.ts` import `dependencies` from their composition root and pass it into a controller/handler **factory** (`itemRoutes(dependencies)`, `createProcessItemHandler(dependencies)`), which closes over it and passes it through to use-case calls. This is plain parameter injection — no DI framework or container library, since the wiring is small enough to stay explicit and readable as-is. If it grows substantially, reconsider then.

## Where new code goes

Ask these questions in order:

1. **Is it a new business rule or workflow step?** → a new use case (or an addition to an existing one) in `packages/core/src/use-cases`. Define whatever new port method it needs on the relevant interface in `packages/core/src/ports`.
2. **Does an existing port need a new capability to support that use case?** → add the method to the port interface in `packages/core`, then implement it in the corresponding adapter (`packages/db`'s repository, `packages/queue`'s adapter, etc.). The port interface changes first; the implementation follows.
3. **Is it a new external integration** (a new port entirely — e.g. an email sender, an LLM tagging client)? → define the port interface in `packages/core/src/ports`, write a concrete adapter for it (in the package that owns that technology, or a new one if none fits), and wire it into the relevant app's `composition.ts`.
4. **Is it purely a delivery-mechanism concern** (an HTTP route, request validation, response shaping, a new BullMQ queue registration)? → the controller/adapter layer in `apps/api` or `apps/worker`. It should still only ever call into `packages/core` for actual logic.

**Hard rule**: if you find yourself importing `drizzle-orm`, `bullmq`, `postgres`, `ioredis`, or `fastify` types into anything under `packages/core`, stop — that's the dependency rule being violated. Business logic must not know its infrastructure.

## Why this exists

Clean Architecture's indirection has a real cost — an extra port interface and adapter class for something that could be a single inline database call. It pays for itself here because:

- **Use cases are independently testable** — `saveItem`/`listItems`/`processItem` can be tested with hand-written fake `ItemRepository`/`ItemQueue`/`MetadataFetcher` implementations, no database or Redis required.
- **Swapping infrastructure is a one-package change** — replacing Drizzle, or adding a second delivery mechanism (a CLI, a second API framework) alongside Fastify, touches `packages/db` or adds a new adapter, not the business logic itself.
- **The dependency rule catches real bugs, not just style violations** — enforcing it during this refactor surfaced two pre-existing issues that loose typing had been hiding: the API was leaking raw `itemsToTags`/`itemsToCollections` join-table shapes into responses instead of the flat `tags`/`collections` the `ItemWithRelations` entity actually declares, and nothing was converting Drizzle's `Date` objects to the `string` the `Item` entity's `createdAt` field declares. Giving the repository an explicit interface to satisfy made TypeScript catch both immediately.
