import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { libraryMdxPlugin } from './scripts/library-mdx-plugin'

const isE2E = process.env.VITE_E2E === 'true'

// Mark packages as external so Rollup doesn't try to resolve them when they
// aren't installed in the build environment (e.g. Docker).
// - @resvg/resvg-js-*: platform-specific native binaries
// - @workspace/infrastructure: only used by dev-only email preview (not in prod Dockerfile)
const externalPackagesPlugin = {
  name: 'external-packages',
  enforce: 'pre' as const,
  resolveId(id: string) {
    if (/^@resvg\/resvg-js-/.test(id) || /^@workspace\/infrastructure/.test(id)) {
      return { id, external: true }
    }
  },
}

const config = defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  ssr: {
    external: ['@resvg/resvg-js', 'satori'],
  },
  optimizeDeps: {
    exclude: ['@resvg/resvg-js', 'satori'],
  },
  plugins: [
    externalPackagesPlugin,
    libraryMdxPlugin(),
    ...isE2E ? [] : [devtools()],
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      // Router config
      router: {
        generatedRouteTree: './routeTree.gen.ts',
      },
    }),
    viteReact({
      include: /\.(mdx|js|jsx|ts|tsx)$/,
    }),
    nitro({
      config: {
        scanDirs: ['server'],
        externals: {
          external: ['@resvg/resvg-js', /^@resvg\/resvg-js-/, 'satori'],
        },
      },
    }),
  ],
})

export default config
