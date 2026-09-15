import { Container } from "inversify";
import { TYPES } from "@second-brain/core";
import type { ItemRepository, MetadataFetcher } from "@second-brain/core";
import { DrizzleItemRepository } from "@second-brain/db";
import { StubMetadataFetcher } from "./adapters/stub-metadata-fetcher";

/**
 * Composition root: the one place concrete infrastructure adapters get
 * bound and resolved for the use-case layer. Nothing below this file knows
 * inversify or Drizzle exist.
 */
const container = new Container();

container.bind<ItemRepository>(TYPES.ItemRepository).to(DrizzleItemRepository).inSingletonScope();
container.bind<MetadataFetcher>(TYPES.MetadataFetcher).to(StubMetadataFetcher).inSingletonScope();

export const dependencies = {
  itemRepository: container.get<ItemRepository>(TYPES.ItemRepository),
  metadataFetcher: container.get<MetadataFetcher>(TYPES.MetadataFetcher),
};

export type Dependencies = typeof dependencies;
