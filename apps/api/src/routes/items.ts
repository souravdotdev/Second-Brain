import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, items } from "@second-brain/db";
import { itemProcessingQueue } from "@second-brain/queue";
import { desc, eq } from "drizzle-orm";
import { detectItemType } from "../lib/detect-item-type";

const createItemSchema = z.object({
  url: z.string().url(),
  collectionId: z.string().uuid().optional(),
});

// TODO: replace with the authenticated user once auth is wired up.
const DEV_USER_ID_HEADER = "x-user-id";

export async function itemRoutes(app: FastifyInstance) {
  app.get("/items", async (request) => {
    const userId = request.headers[DEV_USER_ID_HEADER] as string | undefined;
    if (!userId) return [];

    return db.query.items.findMany({
      where: eq(items.userId, userId),
      orderBy: desc(items.createdAt),
      with: {
        itemsToTags: { with: { tag: true } },
        itemsToCollections: { with: { collection: true } },
      },
    });
  });

  app.post("/items", async (request, reply) => {
    const userId = request.headers[DEV_USER_ID_HEADER] as string | undefined;
    if (!userId) {
      return reply.status(401).send({ error: "Missing x-user-id header" });
    }

    const parsed = createItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { url, collectionId } = parsed.data;
    const type = detectItemType(url);

    const [item] = await db
      .insert(items)
      .values({ userId, sourceUrl: url, type, status: "processing" })
      .returning();

    if (!item) {
      return reply.status(500).send({ error: "Failed to create item" });
    }

    await itemProcessingQueue.add("process-item", {
      itemId: item.id,
      sourceUrl: item.sourceUrl,
      type: item.type,
    });

    return reply.status(201).send({ item, collectionId: collectionId ?? null });
  });
}
