import { fileURLToPath } from "node:url";
import { mergeConfig } from "vitest/config";
import { reactConfig } from "@second-brain/vitest-config/react";

export default mergeConfig(reactConfig, {
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
