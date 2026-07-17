import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    // e2e/ contiene spec Playwright (test runner e API diversi, cfr.
    // playwright.config.ts): Vitest non deve provare a eseguirli.
    exclude: ["**/node_modules/**", "e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
