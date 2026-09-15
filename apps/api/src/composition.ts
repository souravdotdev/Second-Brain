import { Container } from "inversify";
import { TYPES } from "@second-brain/core";
import type { ItemQueue, ItemRepository } from "@second-brain/core";
import { DrizzleItemRepository } from "@second-brain/db";
import { BullMqItemQueue } from "@second-brain/queue";

/**
 * Composition root: the one place concrete infrastructure adapters get
 * bound and resolved for the use-case layer. Nothing below this file knows
 * inversify, Drizzle, or BullMQ exist.
 */
const container = new Container();

container.bind<ItemRepository>(TYPES.ItemRepository).to(DrizzleItemRepository).inSingletonScope();
container.bind<ItemQueue>(TYPES.ItemQueue).to(BullMqItemQueue).inSingletonScope();

export const dependencies = {
  itemRepository: container.get<ItemRepository>(TYPES.ItemRepository),
  itemQueue: container.get<ItemQueue>(TYPES.ItemQueue),
};

export type Dependencies = typeof dependencies;
