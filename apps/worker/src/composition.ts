import { DrizzleItemRepository } from "@second-brain/db";
import { StubMetadataFetcher } from "./adapters/stub-metadata-fetcher";

/**
 * Composition root: the one place concrete infrastructure adapters get
 * wired up and handed to the use-case layer. Nothing below this file
 * imports Drizzle directly.
 */
export const dependencies = {
  itemRepository: new DrizzleItemRepository(),
  metadataFetcher: new StubMetadataFetcher(),
};

export type Dependencies = typeof dependencies;
