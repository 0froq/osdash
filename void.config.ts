import { defineConfig } from 'void/config'

// Server app. Nuxt owns routing; Void deploys the Worker plus assets.
// Confirmed against Void's app-type and Nuxt guides. See AGENTS.md.
export default defineConfig({
  target: 'cloudflare',
  inference: {
    appType: 'framework',
    build: 'pnpm exec vp run build',
    bindings: {
      kv: 'CACHE',
      ai: 'AI',
    },
  },
  cloudflare: {
    name: 'osdash',
    routes: [{ pattern: 'osdash.froq.me', custom_domain: true }],
    workers_dev: false,
    preview_urls: true,
    vars: {
      OSDASH_ACCESS_ENFORCE: 'false',
    },
    compatibility_date: '2026-10-19',
    compatibility_flags: ['nodejs_compat', 'nodejs_als'],
    observability: {
      enabled: true,
      traces: { enabled: true },
    },
  },
})
