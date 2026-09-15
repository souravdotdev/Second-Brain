import { desc, eq } from "drizzle-orm";
import type { CreateItemRecord, ItemRepository } from "@second-brain/core";
import type { Collection, Item, ItemStatus, ItemWithRelations, Tag } from "@second-brain/types";
import { db } from "../client";
import { collections, items, tags } from "../schema";

// Postgres `timestamp` columns come back from Drizzle as native `Date`
// objects; the domain entities in @second-brain/types declare `createdAt` as
// `string`. Translating between the two is exactly the repository's job.
function toItem(row: typeof items.$inferSelect): Item {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

function toTag(row: typeof tags.$inferSelect): Tag {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

function toCollection(row: typeof collections.$inferSelect): Collection {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

/** Concrete adapter: implements the use-case layer's ItemRepository port with Drizzle + Postgres. */
export class DrizzleItemRepository implements ItemRepository {
  async create(record: CreateItemRecord): Promise<Item> {
    const [row] = await db.insert(items).values(record).returning();

    if (!row) {
      throw new Error("Failed to create item");
    }

    return toItem(row);
  }

  async findAllByUser(userId: string): Promise<ItemWithRelations[]> {
    const rows = await db.query.items.findMany({
      where: eq(items.userId, userId),
      orderBy: desc(items.createdAt),
      with: {
        itemsToTags: { with: { tag: true } },
        itemsToCollections: { with: { collection: true } },
      },
    });

    return rows.map(({ itemsToTags, itemsToCollections, ...row }) => ({
      ...toItem(row),
      tags: itemsToTags.map(({ tag }) => toTag(tag)),
      collections: itemsToCollections.map(({ collection }) => toCollection(collection)),
    }));
  }

  async updateStatus(
    itemId: string,
    status: ItemStatus,
    patch?: Partial<Pick<Item, "title">>,
  ): Promise<void> {
    await db
      .update(items)
      .set({ status, ...patch })
      .where(eq(items.id, itemId));
  }
}
