import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    globals: false,
    include: ["eval/classifier-live.test.ts"],
    testTimeout: 600_000,
    hookTimeout: 30_000,
  },
});
