import type { Job } from "bullmq";
import { db, items } from "@second-brain/db";
import { eq } from "drizzle-orm";
import type { ProcessItemJob } from "@second-brain/queue";

/**
 * Fetches metadata for the item's source URL and generates AI tag
 * suggestions. Stubbed for now — replace with real extraction (Open Graph /
 * oEmbed / YouTube API / PDF text extraction) and an LLM tagging call.
 */
export async function processItem(job: Job<ProcessItemJob>) {
  const { itemId, sourceUrl, type } = job.data;

  try {
    const title = new URL(sourceUrl).hostname;

    await db
      .update(items)
      .set({ title, status: "ready" })
      .where(eq(items.id, itemId));
  } catch (error) {
    await db.update(items).set({ status: "failed" }).where(eq(items.id, itemId));
    throw error;
  }

  return { itemId, type };
}
