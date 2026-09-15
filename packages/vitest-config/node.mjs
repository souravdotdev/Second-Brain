import { defineConfig } from "vitest/config";

export const nodeConfig = defineConfig({
  test: {
    environment: "node",
    // Belt-and-suspenders: tsconfig excludes *.test.ts from `tsc` builds, but
    // this stops a stale/leftover dist/ from getting its compiled test files
    // picked up and double-run alongside the real source tests.
    exclude: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
  },
});
