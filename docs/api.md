# API

Fastify server in `apps/api`. Entry point `src/index.ts`; item routes in `src/routes/items.ts`.

Base URL locally: `http://localhost:4000` (from `PORT` in `apps/api/.env`).

**Routes are thin controllers, not where the logic lives.** Per [Clean Architecture](./clean-architecture.md), `src/routes/items.ts` only validates the HTTP request against a DTO schema and calls a use case from `@second-brain/core` — it never touches Drizzle or BullMQ directly. Concrete adapters (`DrizzleItemRepository`, `BullMqItemQueue`) are wired up once in `src/composition.ts` and passed into the routes. If you're looking for the actual save/list logic, it's in `packages/core/src/use-cases`, not here.

## Request/response validation (DTOs)

Every route's request and response shapes are defined as Zod schemas in `src/dto/item.dto.ts`, wired into Fastify via [`fastify-type-provider-zod`](https://github.com/turkerdev/fastify-type-provider-zod) (registered once in `src/index.ts` via `setValidatorCompiler`/`setSerializerCompiler`). This replaces manually calling `.safeParse()` in the handler — instead, a route declares `schema: { body, response }`, and Fastify:

- **Validates the request** before the handler runs, and types `request.body` from the schema (no manual cast needed).
- **Serializes the response** through the declared schema, which also acts as an output filter — any field the handler's return value has that isn't declared in the schema gets silently stripped. This was verified directly: a deliberately-injected extra field on a fake repository's return value did not appear in the actual HTTP response.

These DTO schemas intentionally live in `apps/api`, separate from the `Item`/`ItemWithRelations` entity types in `packages/types` — per [Clean Architecture](./clean-architecture.md#the-layers-mapped-to-this-codebase), a controller's DTOs are a boundary concern, not the same thing as a domain entity, even where their shape currently overlaps closely.

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
    "tags": [],
    "collections": []
  }
]
```

Validated against `listItemsResponseSchema` (`src/dto/item.dto.ts`).

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

Validated against `createItemBodySchema` (`src/dto/item.dto.ts`) — `url` must be a valid URL, `collectionId` must be a valid UUID if present.

**Response** `201` (validated against `createItemResponseSchema`):

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

**Response** `400` (validation failure — this is Fastify's own standard validation-error format, not a custom shape; a failure here is caught by the validator before the handler runs at all):

```json
{
  "statusCode": 400,
  "code": "FST_ERR_VALIDATION",
  "error": "Bad Request",
  "message": "body/url Invalid URL"
}
```

**Response** `401` (missing `x-user-id`, validated against `errorResponseSchema` — this one _is_ sent manually by the handler, since header presence is a business-logic check, not a DTO schema validation):

```json
{ "error": "Missing x-user-id header" }
```

Note: `collectionId` is accepted and validated but not yet used to actually attach the item to a collection — that wiring (an insert into `items_to_collections`) isn't implemented yet.

## Item type detection

`detectItemType(url)` (`packages/core/src/lib/detect-item-type.ts` — a business rule, not an HTTP concern, so it lives in the use-case layer and is called from inside the `saveItem` use case) infers the type from the URL, server-side, so the client never has to specify it:

| Condition                                                                          | Type      |
| ---------------------------------------------------------------------------------- | --------- |
| `x.com` / `twitter.com`                                                            | `tweet`   |
| `youtube.com` / `youtu.be`                                                         | `video`   |
| Path ends in `.pdf`                                                                | `pdf`     |
| Path ends in an image extension (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`) | `image`   |
| Anything else                                                                      | `article` |
