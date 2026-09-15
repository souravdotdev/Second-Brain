import { Worker } from "bullmq";
import { QUEUE_NAMES, redisConnection } from "@second-brain/queue";
import { processItem } from "./processors/process-item";

const worker = new Worker(QUEUE_NAMES.ITEM_PROCESSING, processItem, {
  connection: redisConnection,
  concurrency: 5,
});

worker.on("completed", (job) => {
  console.log(`[worker] processed item ${job.data.itemId}`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] failed item ${job?.data.itemId}:`, err.message);
});

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
