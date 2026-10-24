import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

// Keep tool configuration outside the root so Nuxt owns its Vite configuration.
export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('../app', import.meta.url)),
      '#shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['shared/**/*.test.ts', 'server/**/*.test.ts', 'app/utils/**/*.test.ts'],
  },
})
