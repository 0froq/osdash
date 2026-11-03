import { defineConfig } from 'vite-plus'

// Tooling lives outside the docs app so Nuxt keeps its own Vite configuration.
export default defineConfig({
  tsconfig: 'tsconfig.json',
})
