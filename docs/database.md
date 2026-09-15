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

Per [Clean Architecture](./clean-architecture.md), `apps/api` and `apps/worker` never import `db` or the schema tables directly — only `packages/db`'s `DrizzleItemRepository` (`src/repositories/item-repository.ts`) does. It implements the `ItemRepository` port interface defined in `packages/core`, and is the only place Drizzle query syntax appears for the items domain:

```ts
import { eq } from "drizzle-orm";
import type { ItemRepository } from "@second-brain/core";
import { db } from "../client";
import { items } from "../schema";

export class DrizzleItemRepository implements ItemRepository {
  async updateStatus(itemId: string, status: ItemStatus) {
    await db.update(items).set({ status }).where(eq(items.id, itemId));
  }
  // ...
}
```

The repository is also responsible for translating Drizzle's raw row shape into the domain entities `packages/types` declares — e.g. converting `createdAt` from Drizzle's native `Date` to the `string` the `Item` entity expects, and flattening the `itemsToTags`/`itemsToCollections` join-table rows into the `tags`/`collections` arrays `ItemWithRelations` actually declares. `apps/api` and `apps/worker` each instantiate `DrizzleItemRepository` once, in their own `src/composition.ts`, and pass it into use cases from `@second-brain/core`.
