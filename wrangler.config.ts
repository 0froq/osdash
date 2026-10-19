import { defineWranglerConfig } from 'wrangler/experimental-config'

// Asset directory for the preview bundler. Do not run the wrangler CLI.
export default defineWranglerConfig({
  types: {
    generate: false,
  },
  assetsDirectory: './.output/public',
})
