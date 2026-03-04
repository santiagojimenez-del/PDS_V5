import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**", "src/modules/**/services/**"],
      exclude: ["src/lib/db/**", "node_modules/**"],
    },
    env: {
      // Provide a deterministic AES key for crypto tests
      AES_KEY: "test_aes_key_for_unit_tests_only",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
