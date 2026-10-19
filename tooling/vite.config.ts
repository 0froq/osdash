import { defineConfig } from 'vite-plus'

// Keep tool configuration outside the root so Nuxt owns its Vite configuration.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['shared/**/*.test.ts'],
  },
})
