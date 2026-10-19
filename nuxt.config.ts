import { voidPlugin } from 'void'
import { themePreferenceScript } from './app/theme'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-19',

  devtools: { enabled: false },

  css: [
    '@fontsource-variable/geist/index.css',
    '@fontsource-variable/geist-mono/index.css',
    '@fontsource/instrument-serif/400.css',
    '@fontsource/instrument-serif/400-italic.css',
    '~/assets/css/board.css',
  ],

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
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'description', content: 'Read-only dashboard for froQ open-source contributions' },
        { name: 'color-scheme', content: 'light dark' },
        { name: 'robots', content: 'noindex' },
      ],
      script: [
        {
          tagPosition: 'head',
          innerHTML: themePreferenceScript(),
        },
      ],
    },
  },

  typescript: { strict: true },
})
