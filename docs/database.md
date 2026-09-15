# Database

Postgres, accessed through [Drizzle ORM](https://orm.drizzle.team) via the `postgres` (postgres.js) driver. Schema lives in `packages/db/src/schema.ts`; the typed client is `packages/db/src/client.ts`, both re-exported from `packages/db/src/index.ts`.

## Schema

Matches the data model in the product plan (`product-plan.md`, section 9).

| Table                  | Purpose                                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`                | `id`, `email`, `createdAt`                                                                                                                                                   |
| `items`                | A saved thing: `type` (article/tweet/image/video/pdf/link), `sourceUrl`, `status` (processing/ready/failed), `title`, `thumbnailUrl`, `author`, `extractedText`, `createdAt` |
| `tags`                 | `name`, `isAiGenerated`, `createdAt`                                                                                                                                         |
| `collections`          | User-created folders: `userId`, `name`, `createdAt`                                                                                                                          |
| `reminders`            | `itemId`, `triggerAt`, `sentAt` (nullable — set once sent)                                                                                                                   |
| `items_to_tags`        | Join table, `items` ↔ `tags` (composite PK)                                                                                                                                  |
| `items_to_collections` | Join table, `items` ↔ `collections` (composite PK)                                                                                                                           |

All primary keys are `uuid` with `defaultRandom()`. `items.userId` and `collections.userId` reference `users.id` with `onDelete: "cascade"`; join-table foreign keys cascade on delete from either side.

Relations (Drizzle's `relations()` helper) are defined for every table, enabling the relational query API — e.g. `apps/api`'s `GET /items` uses `db.query.items.findMany({ with: { itemsToTags: { with: { tag: true } }, ... } })` rather than hand-written joins.

## Enums

- `item_type`: `article` | `tweet` | `image` | `video` | `pdf` | `link`
- `item_status`: `processing` | `ready` | `failed`

Item type is inferred server-side from the URL (see `apps/api/src/lib/detect-item-type.ts`) — the client never sends it directly.

## Migration workflow

Drizzle Kit is configured in `packages/db/drizzle.config.ts`, pointed at `src/schema.ts` and outputting to `./drizzle` (gitignored — generated SQL, not hand-edited).

```bash
pnpm db:generate   # diff the schema against the last migration, write a new SQL migration file
pnpm db:migrate    # apply all pending migrations to DATABASE_URL
pnpm db:studio     # open Drizzle Studio, a local DB browser/editor
```

These are all `turbo run <task> --filter=@second-brain/db` under the hood (see root `package.json`). Requires `packages/db/.env` to be set — see [Environment Variables](./environment-variables.md).

**Workflow when you change the schema**: edit `packages/db/src/schema.ts` → `pnpm db:generate` (review the generated SQL in `packages/db/drizzle/`) → `pnpm db:migrate`. Never hand-edit generated migration files after they've been applied anywhere — generate a new one instead.

## Querying from apps

`apps/api` and `apps/worker` both import the `db` client and schema tables directly from `@second-brain/db`:

```ts
import { db, items } from "@second-brain/db";
import { eq } from "drizzle-orm";

await db.update(items).set({ status: "ready" }).where(eq(items.id, itemId));
```

There's no repository/data-access abstraction layer — see the note on architectural pattern in [Architecture](./architecture.md) for why, and when that would be worth changing.
