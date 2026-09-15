import { Queue } from "bullmq";
import type { ItemType } from "@second-brain/types";
import { redisConnection } from "./connection";

export const QUEUE_NAMES = {
  ITEM_PROCESSING: "item-processing",
} as const;

/** Enqueued right after a paste-a-link save; the worker fetches metadata + AI tags. */
export interface ProcessItemJob {
  itemId: string;
  sourceUrl: string;
  type: ItemType;
}

export const itemProcessingQueue = new Queue<ProcessItemJob>(QUEUE_NAMES.ITEM_PROCESSING, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: 1_000,
    removeOnFail: 5_000,
  },
});
