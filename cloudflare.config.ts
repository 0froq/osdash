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
      CACHE: bindings.kv(),
      GITHUB_TOKEN: bindings.secret(),
    },
  },
})
