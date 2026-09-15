import type { ItemQueue, ProcessItemJob } from "@second-brain/core";
import { itemProcessingQueue } from "../queues";

/** Concrete adapter: implements the use-case layer's ItemQueue port with BullMQ. */
export class BullMqItemQueue implements ItemQueue {
  async enqueueProcessing(job: ProcessItemJob): Promise<void> {
    await itemProcessingQueue.add("process-item", job);
  }
}
