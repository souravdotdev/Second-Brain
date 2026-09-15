import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
});

// Next.js statically replaces `process.env.NEXT_PUBLIC_*` expressions at build
// time for client bundles — it must appear literally like this, not as a
// spread of the whole `process.env` object, or the browser build breaks.
const parsed = schema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables in web:\n${issues}`);
}

export const env = parsed.data;
