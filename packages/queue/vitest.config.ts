import { mergeConfig } from "vitest/config";
import { nodeConfig } from "@second-brain/vitest-config/node";

export default mergeConfig(nodeConfig, {
  test: {
    // No pure/isolable logic here yet — BullMqItemQueue only wraps a live
    // Queue instance that needs a real Redis connection. See docs/testing.md.
    passWithNoTests: true,
  },
});
