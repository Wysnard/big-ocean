import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "src/services/**/*.ts",
        "src/repositories/**/*.ts",
        "src/types/**/*.ts",
        "src/constants/**/*.ts",
        "src/utils/**/*.ts",
      ],
      exclude: ["**/*.test.ts", "**/__tests__/**"],
    },
  },
});
