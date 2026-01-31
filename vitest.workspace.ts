import { defineWorkspace } from "vitest/config"
import path from "path"

/**
 * Vitest Workspace Configuration
 *
 * Defines different test environments for different parts of the monorepo:
 * - Frontend (apps/front): jsdom environment for React component tests
 * - Backend & Packages: node environment for server-side tests
 */
export default defineWorkspace([
  // Frontend tests (React components) - requires DOM environment
  {
    extends: "./apps/front/vitest.config.ts",
    test: {
      name: "frontend",
      include: ["apps/front/**/*.test.{ts,tsx}"],
      environment: "jsdom",
    },
  },

  // Backend and package tests - Node.js environment
  {
    test: {
      name: "backend-and-packages",
      include: [
        "apps/api/**/*.test.ts",
        "packages/**/*.test.ts",
      ],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
      ],
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
          "**/index.ts",
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
        // Workspace package aliases
        "@workspace/ui/components": path.resolve(__dirname, "./packages/ui/src/components"),
        "@workspace/ui/lib": path.resolve(__dirname, "./packages/ui/src/lib"),
        "@workspace/ui/hooks": path.resolve(__dirname, "./packages/ui/src/hooks"),
        "@workspace/infrastructure/auth-schema": path.resolve(__dirname, "./packages/infrastructure/src/auth-schema"),
        "@workspace": path.resolve(__dirname, "./packages"),
        "~": path.resolve(__dirname, "./"),
      },
    },
  },
])
