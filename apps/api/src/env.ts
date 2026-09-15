import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables in api:\n${issues}`);
}

export const env = parsed.data;
