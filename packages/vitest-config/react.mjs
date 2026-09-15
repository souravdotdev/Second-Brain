import { defineConfig, mergeConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { nodeConfig } from "./node.mjs";

export const reactConfig = mergeConfig(
  nodeConfig,
  defineConfig({
    plugins: [react()],
    test: {
      environment: "jsdom",
      // Lets @testing-library/react auto-detect the global afterEach and
      // register its own DOM cleanup — otherwise rendered output from one
      // test leaks into the next within the same file.
      globals: true,
    },
  }),
);
