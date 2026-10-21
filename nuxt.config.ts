import { voidPlugin } from 'void'
import { themePreferenceScript } from './app/theme'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-19',

  devtools: { enabled: false },

  components: [{ path: '~/components', pathPrefix: false }],

  css: [
    '@fontsource-variable/geist/index.css',
    '@fontsource-variable/geist-mono/index.css',
    '@fontsource/instrument-serif/400.css',
    '@fontsource/instrument-serif/400-italic.css',
    '~/assets/css/tokens.css',
    '~/assets/css/inbox.css',
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
      htmlAttrs: { lang: 'zh-CN' },
      meta: [
        { name: 'description', content: '用 GitHub 登录，看你自己的开源贡献进展。只读。' },
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
