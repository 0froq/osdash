import { bindings, defineConfig } from 'cf/config'
import voidConfig from './void.config.ts'

// Preview adapter only. Production routes stay in void.config.ts.
const { cloudflare } = voidConfig

export default defineConfig({
  worker: {
    name: cloudflare.name,
    compatibilityDate: cloudflare.compatibility_date,
    compatibilityFlags: [...(cloudflare.compatibility_flags ?? [])],
    observability: {
      enabled: cloudflare.observability?.enabled ?? true,
      traces: { enabled: cloudflare.observability?.traces?.enabled ?? true },
    },
    workersDev: cloudflare.workers_dev,
    previewUrls: cloudflare.preview_urls,
    entrypoint: '.output/server/index.mjs',
    assets: {
      notFoundHandling: 'none',
      runWorkerFirst: true,
    },
    env: {
      // nitro cloudflare-module serves /_nuxt/* via env.ASSETS when run_worker_first is on.
      ASSETS: bindings.assets(),
      CACHE: bindings.kv(),
      AI: bindings.ai(),
      GITHUB_CLIENT_ID: bindings.secret(),
      GITHUB_CLIENT_SECRET: bindings.secret(),
      SESSION_SECRET: bindings.secret(),
      GITHUB_TOKEN: bindings.secret(),
      ACCESS_TEAM_DOMAIN: bindings.text('frosty-snow-6058.cloudflareaccess.com'),
      ACCESS_AUD: bindings.text('09f51afadabd2d971712f33c83c3c74912b0ddb49d8c20925c1111640a4283e7'),
      OSDASH_ACCESS_ENFORCE: bindings.text('true'),
    },
  },
})
