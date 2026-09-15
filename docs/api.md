# API

Fastify server in `apps/api`. Entry point `src/index.ts`; item routes in `src/routes/items.ts`.

Base URL locally: `http://localhost:4000` (from `PORT` in `apps/api/.env`).

## Auth (placeholder)

There's no real authentication yet. Every route reads a user id from an `x-user-id` header instead of a session/token — marked with a `TODO` in the code (`apps/api/src/routes/items.ts`) to replace once auth is wired up. The id must correspond to an existing row in the `users` table (there's a foreign key from `items.userId`), so you can't just pass an arbitrary UUID — seed a user first.

## `GET /health`

Liveness check.

```
200 OK
{ "status": "ok" }
```

## `GET /items`

Lists the requesting user's items, including their tags and collections.

**Headers**: `x-user-id: <uuid>` (required — returns `[]` if missing, does not error)

**Response** `200`:

```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "type": "article",
    "sourceUrl": "https://example.com/some-article",
    "status": "ready",
    "title": "example.com",
    "thumbnailUrl": null,
    "author": null,
    "extractedText": null,
    "createdAt": "2026-09-15T05:52:11.579Z",
    "itemsToTags": [],
    "itemsToCollections": []
  }
]
```

Ordered newest-first (`orderBy: desc(items.createdAt)`).

## `POST /items`

The paste-a-link save flow. Detects item type from the URL, inserts the item as `processing`, and enqueues a background job to fetch metadata (see [Queue & Background Jobs](./queue.md)).

**Headers**: `x-user-id: <uuid>` (required — `401` if missing)

**Body**:

```json
{
  "url": "https://example.com/some-article",
  "collectionId": "uuid (optional)"
}
```

Validated with Zod (`createItemSchema` in `routes/items.ts`) — `url` must be a valid URL, `collectionId` must be a valid UUID if present.

**Response** `201`:

```json
{
  "item": {
    "id": "uuid",
    "userId": "uuid",
    "type": "article",
    "sourceUrl": "https://example.com/some-article",
    "status": "processing",
    "title": null,
    "thumbnailUrl": null,
    "author": null,
    "extractedText": null,
    "createdAt": "2026-09-15T05:52:11.579Z"
  },
  "collectionId": null
}
```

**Response** `400` (validation failure):

```json
{ "error": { "formErrors": [...], "fieldErrors": {...} } }
```

(Zod's `.flatten()` output.)

Note: `collectionId` is accepted and validated but not yet used to actually attach the item to a collection — that wiring (an insert into `items_to_collections`) isn't implemented yet.

## Item type detection

`detectItemType(url)` (`apps/api/src/lib/detect-item-type.ts`) infers the type from the URL, server-side, so the client never has to specify it:

| Condition                                                                          | Type      |
| ---------------------------------------------------------------------------------- | --------- |
| `x.com` / `twitter.com`                                                            | `tweet`   |
| `youtube.com` / `youtu.be`                                                         | `video`   |
| Path ends in `.pdf`                                                                | `pdf`     |
| Path ends in an image extension (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`) | `image`   |
| Anything else                                                                      | `article` |
