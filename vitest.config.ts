import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    // Environment
    environment: "node",
    globals: true,

    // Coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.ts",
        "**/index.ts", // Export files
        "**/__tests__/**",
        "**/test-utils/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Performance
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporters
    reporters: ["verbose"],

    // Watch mode
    watch: false,
  },

  resolve: {
    alias: {
      "@workspace": path.resolve(__dirname, "./packages"),
      "~": path.resolve(__dirname, "./"),
    },
  },
})
