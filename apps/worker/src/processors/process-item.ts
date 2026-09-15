import type { Job } from "bullmq";
import type { ProcessItemJob } from "@second-brain/core";
import { processItem as processItemUseCase } from "@second-brain/core";
import type { Dependencies } from "../composition";

/** Delivery-mechanism adapter: unwraps a BullMQ job and calls the use case. */
export function createProcessItemHandler(deps: Dependencies) {
  return async function processItem(job: Job<ProcessItemJob>) {
    const { itemId, sourceUrl } = job.data;

    await processItemUseCase(deps, { itemId, sourceUrl });

    return { itemId };
  };
}
