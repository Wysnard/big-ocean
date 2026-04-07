import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
  resolve: {
    conditions: ['import', 'module', 'default'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Workspace package aliases — subpath exports resolve via conditions above,
      // but ui needs explicit aliases because its exports use bare paths (no src/)
      '@workspace/ui/components': path.resolve(__dirname, '../../packages/ui/src/components'),
      '@workspace/ui/lib': path.resolve(__dirname, '../../packages/ui/src/lib'),
      '@workspace/ui/hooks': path.resolve(__dirname, '../../packages/ui/src/hooks'),
    },
  },
})
