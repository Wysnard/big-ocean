import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Environment
    environment: "node",
    globals: true,

    // Universal setup file (works for both node and jsdom environments)
    setupFiles: ["./vitest.setup.ts"],

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
      // Frontend app alias
      "@": path.resolve(__dirname, "./apps/front/src"),
      // Specific subpath aliases for package.json exports (Vitest doesn't resolve these automatically)
      "@workspace/ui/components": path.resolve(
        __dirname,
        "./packages/ui/src/components",
      ),
      "@workspace/ui/lib": path.resolve(__dirname, "./packages/ui/src/lib"),
      "@workspace/ui/hooks": path.resolve(__dirname, "./packages/ui/src/hooks"),
      "@workspace/infrastructure/auth-schema": path.resolve(
        __dirname,
        "./packages/infrastructure/src/auth-schema",
      ),
      // General workspace alias
      "@workspace": path.resolve(__dirname, "./packages"),
      "~": path.resolve(__dirname, "./"),
    },
  },
});
