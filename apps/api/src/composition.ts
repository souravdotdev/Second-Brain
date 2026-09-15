import { DrizzleItemRepository } from "@second-brain/db";
import { BullMqItemQueue } from "@second-brain/queue";

/**
 * Composition root: the one place concrete infrastructure adapters get
 * wired up and handed to the use-case layer. Nothing below this file
 * imports Drizzle or BullMQ directly.
 */
export const dependencies = {
  itemRepository: new DrizzleItemRepository(),
  itemQueue: new BullMqItemQueue(),
};

export type Dependencies = typeof dependencies;
