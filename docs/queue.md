# Queue & Background Jobs

Async processing is handled with [BullMQ](https://docs.bullmq.io) backed by Redis. The reasoning: link fetching, metadata extraction, and AI tagging are all slow/unreliable enough that they can't block the save request (see product plan, section 10) — a user pastes a link, the item appears immediately as `processing`, and a worker fills in the rest.

## `packages/queue`

Shared between the producer and the consumer so the queue name and job payload shape are defined exactly once:

- `src/connection.ts` — a single `ioredis` connection, built from `REDIS_URL`
- `src/queues.ts` — `QUEUE_NAMES.ITEM_PROCESSING`, the `itemProcessingQueue` instance, and the `ProcessItemJob` payload type (`{ itemId, sourceUrl, type }`)

Default job options (`src/queues.ts`): 3 attempts with exponential backoff (5s base delay), and completed/failed jobs are trimmed (`removeOnComplete: 1000`, `removeOnFail: 5000`) so Redis doesn't accumulate job history indefinitely.

## Producer: `apps/api`

`POST /items` (see [API](./api.md)) inserts the item row as `status: "processing"`, then enqueues:

```ts
await itemProcessingQueue.add("process-item", {
  itemId: item.id,
  sourceUrl: item.sourceUrl,
  type: item.type,
});
```

## Consumer: `apps/worker`

`src/index.ts` starts a BullMQ `Worker` listening on `QUEUE_NAMES.ITEM_PROCESSING` with `concurrency: 5`, handled by `processItem` (`src/processors/process-item.ts`):

1. Fetches metadata for the item's `sourceUrl`
2. Updates the item's `title` and sets `status: "ready"`
3. On any thrown error, sets `status: "failed"` and rethrows (so BullMQ's retry/backoff applies)

**Current state: the metadata fetch is stubbed** — it just uses the URL's hostname as the title. Real extraction (Open Graph for articles, oEmbed for tweets, the YouTube API for videos, text extraction for PDFs) and the AI tag-suggestion call are not implemented yet; see product plan section 6 for the intended scope.

The worker logs `[worker] processed item <id>` on success and the error message on failure (`worker.on("completed"/"failed", ...)`), and closes gracefully on `SIGTERM`.

## Verifying it works locally

With Postgres + Redis running and both `apps/api` and `apps/worker` started:

```bash
curl -X POST http://localhost:4000/items \
  -H "Content-Type: application/json" \
  -H "x-user-id: <existing user id>" \
  -d '{"url":"https://example.com/some-article"}'
```

Then `GET /items` with the same header — the item's `status` should flip from `processing` to `ready` within a second or two, and the worker's stdout logs the processed item id.
