import { defineConfig } from 'void/config'

// Server app. Nuxt owns routing; Void deploys the Worker plus assets.
// Confirmed against Void's app-type and Nuxt guides. See AGENTS.md.
export default defineConfig({
  target: 'cloudflare',
  inference: {
    appType: 'framework',
    build: 'pnpm exec vp run build',
    bindings: {
      ai: 'AI',
    },
  },
  cloudflare: {
    name: 'osdash',
    durable_objects: { bindings: [{ name: 'DEVICE_RELAY', class_name: 'DeviceRelay' }] },
    migrations: [{ tag: 'device-relay-v1', new_sqlite_classes: ['DeviceRelay'] }],
    routes: [{ pattern: 'osdash.froq.me', custom_domain: true }],
    workers_dev: false,
    preview_urls: true,
    compatibility_date: '2026-10-19',
    compatibility_flags: ['nodejs_compat', 'nodejs_als'],
    observability: {
      enabled: true,
      traces: { enabled: true },
    },
  },
})
