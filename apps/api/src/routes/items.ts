import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { saveItem, listItems } from "@second-brain/core";
import type { Dependencies } from "../composition";

const createItemSchema = z.object({
  url: z.string().url(),
  collectionId: z.string().uuid().optional(),
});

// TODO: replace with the authenticated user once auth is wired up.
const DEV_USER_ID_HEADER = "x-user-id";

/** Controller layer: parses/validates HTTP input, calls a use case, formats the HTTP response. */
export function itemRoutes(deps: Dependencies) {
  return async function registerItemRoutes(app: FastifyInstance) {
    app.get("/items", async (request) => {
      const userId = request.headers[DEV_USER_ID_HEADER] as string | undefined;
      if (!userId) return [];

      return listItems(deps, { userId });
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

      const item = await saveItem(deps, { userId, url: parsed.data.url });

      return reply.status(201).send({ item, collectionId: parsed.data.collectionId ?? null });
    });
  };
}
