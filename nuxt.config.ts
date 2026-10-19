import { voidPlugin } from 'void'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-19',

  devtools: { enabled: false },

  css: ['@fontsource-variable/geist/index.css', '~/assets/css/board.css'],

  vite: {
    plugins: [voidPlugin()],
  },

  nitro: {
    preset: 'cloudflare-module',
    cloudflare: {
      nodeCompat: true,
      dev: { configPath: './.void-wrangler.jsonc' },
      wrangler: {
        name: 'osdash',
        compatibility_date: '2026-10-19',
        compatibility_flags: ['nodejs_compat', 'nodejs_als'],
        kv_namespaces: [{ binding: 'CACHE', id: 'local-osdash-cache' }],
      },
    },
  },

  app: {
    head: {
      title: 'osdash',
      htmlAttrs: { lang: 'zh-CN' },
      meta: [
        { name: 'description', content: 'froQ 的开源贡献看板' },
        { name: 'color-scheme', content: 'dark' },
        { name: 'robots', content: 'noindex' },
      ],
    },
  },

  typescript: { strict: true },
})
