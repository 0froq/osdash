import { voidPlugin } from 'void'
import { themePreferenceScript } from './app/theme'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-19',

  build: { transpile: ['@froq/ui'] },

  devtools: { enabled: true },

  components: [{ path: '~/components', pathPrefix: false }],

  css: [
    '@fontsource-variable/geist/index.css',
    '@fontsource-variable/geist-mono/index.css',
    '@fontsource/instrument-serif/400.css',
    '@fontsource/instrument-serif/400-italic.css',
    // Scoped to `.ui`; osdash skin stays on :root in tokens.css + inbox.css.
    '@froq/ui/tokens.css',
    '~/assets/css/tokens.css',
    '~/assets/css/inbox.css',
    '~/assets/css/story.css',
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
        {
          name: 'description',
          content: 'Sign in with GitHub and follow your own open-source contributions. Read-only.',
        },
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

  runtimeConfig: {
    public: {
      osdashMock: process.env.OSDASH_MOCK || '',
    },
  },
})
