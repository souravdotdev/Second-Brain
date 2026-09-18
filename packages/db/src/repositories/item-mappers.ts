import type { Collection, Item, Tag, User } from "@second-brain/types";
import { collections, items, tags, users } from "../../schema";

// Postgres `timestamp` columns come back from Drizzle as native `Date`
// objects; the domain entities in @second-brain/types declare `createdAt` as
// `string`. Translating between the two is exactly the repository's job.
export function toItem(row: typeof items.$inferSelect): Item {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export function toTag(row: typeof tags.$inferSelect): Tag {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export function toCollection(row: typeof collections.$inferSelect): Collection {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

// `name`/`emailVerified`/`updatedAt` are better-auth internals with no use
// case yet — deliberately dropped here rather than spread, and `image` (the
// Drizzle key better-auth's adapter expects) is renamed to `profileImg` to
// match the domain type.
export function toUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    profileImg: row.image,
    createdAt: row.createdAt.toISOString(),
  };
}
