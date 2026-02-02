import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Workspace package aliases
      "@workspace/ui/components": path.resolve(
        __dirname,
        "../../packages/ui/src/components",
      ),
      "@workspace/ui/lib": path.resolve(__dirname, "../../packages/ui/src/lib"),
      "@workspace/ui/hooks": path.resolve(
        __dirname,
        "../../packages/ui/src/hooks",
      ),
      "@workspace": path.resolve(__dirname, "../../packages"),
    },
  },
});
