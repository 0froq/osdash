import { fileURLToPath } from 'node:url'
import { voidPlugin } from 'void'
import { themePreferenceScript } from './app/theme'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-19',

  build: { transpile: ['@froq/ui'] },

  modules: ['@nuxtjs/i18n'],

  i18n: {
    locales: [{ code: 'en', language: 'en-US', file: 'en.ts' }],
    defaultLocale: 'en',
    strategy: 'no_prefix',
  },

  devtools: { enabled: true },

  components: [{ path: '~/components', pathPrefix: false }],

  css: [
    '@froq/ui/tokens.css',
    '@fontsource-variable/geist/index.css',
    '@fontsource-variable/geist-mono/index.css',
    '@fontsource/instrument-serif/400.css',
    '@fontsource/instrument-serif/400-italic.css',
    // Scoped to `.ui`: bridges the library tokens to the osdash skin in tokens.css.
    '~/assets/css/ui.css',
    '~/assets/css/tokens.css',
  ],

  vite: {
    plugins: [voidPlugin()],
  },

  nitro: {
    externals: { external: ['miniflare', 'rolldown'] },
    preset: 'cloudflare-module',
    cloudflare: {
      nodeCompat: true,
      dev: { configPath: './.void-wrangler.jsonc' },
      wrangler: {
        name: 'osdash',
        compatibility_date: '2026-10-19',
        compatibility_flags: ['nodejs_compat', 'nodejs_als'],
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

  hooks: {
    'nitro:config'(config) {
      if (config.dev) {
        config.plugins ??= []
        config.plugins.push(fileURLToPath(new URL('./server/dev/relay-plugin.ts', import.meta.url)))
      }
    },
  },

  $development: {
    runtimeConfig: { public: { osdashLocalBridgeUrl: 'http://127.0.0.1:47832' } },
  },

  runtimeConfig: {
    public: {
      osdashLocalBridgeUrl: 'http://127.0.0.1:47831',
      osdashMock: process.env.OSDASH_MOCK || '',
    },
  },
})
