import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const isE2E = process.env.VITE_E2E === 'true'

// Mark @resvg/resvg-js platform-specific native binaries as external so Nitro's
// nf3 plugin doesn't try to resolve packages that only exist for other platforms
// (e.g. @resvg/resvg-js-android-arm-eabi on a Linux x64 CI runner).
const resvgExternalPlugin = {
  name: 'resvg-external',
  enforce: 'pre' as const,
  resolveId(id: string) {
    if (/^@resvg\/resvg-js-/.test(id)) {
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
    resvgExternalPlugin,
    ...isE2E ? [] : [devtools()],
    nitro({
      config: {
        scanDirs: ['server'],
        externals: {
          external: ['@resvg/resvg-js', /^@resvg\/resvg-js-/, 'satori'],
        },
      },
    }),
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
    viteReact(),
  ],
})

export default config
