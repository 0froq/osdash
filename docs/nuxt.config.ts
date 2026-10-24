import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { countCardWords } from '@froq/og-covers-layer/card-words'
import { componentFile } from './app/utils/component-files'
import { keepEmptyTitle } from './app/utils/empty-title'
import { listPublicShareImages } from './app/utils/public-files'
import { IMAGE_ORIGIN, SITE_DESCRIPTION, SITE_NAME } from './app/utils/site'

const siteDist = fileURLToPath(new URL('../dist', import.meta.url))
const componentsRoot = fileURLToPath(new URL('../src/components', import.meta.url))

function componentRoutes(): string[] {
  const routes: string[] = []
  for (const concept of readdirSync(componentsRoot, { withFileTypes: true })) {
    if (!concept.isDirectory())
      continue
    routes.push(`/components/${concept.name}`, `/zh/components/${concept.name}`)
    const files = readdirSync(fileURLToPath(new URL(`../src/components/${concept.name}`, import.meta.url)))
    for (const file of files) {
      const entry = componentFile(`${concept.name}/${file}`)
      if (!entry || entry.demo)
        continue
      routes.push(entry.to, `/zh${entry.to}`)
    }
  }
  return routes
}

export default defineNuxtConfig({
  extends: [
    ['github:0froq/og-layer#v0.2.1', { install: true }],
  ],

  compatibilityDate: '2026-09-19',

  hooks: {
    'content:file:afterParse': ({ file, content }) => {
      keepEmptyTitle(content, file.body)
      if (typeof file.body === 'string')
        (content as { words?: number }).words = countCardWords(file.body)
    },
  },

  runtimeConfig: {
    public: {
      publicFiles: listPublicShareImages(),
    },
  },

  modules: [
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@nuxt/eslint',
  ],

  devtools: { enabled: true },

  // `og:image` is absolute on this origin. `og:url` stays on ui.froq.me via useShareMeta.
  site: {
    url: IMAGE_ORIGIN,
    name: SITE_NAME,
  },

  css: [
    '~/assets/css/fonts.css',
    '@froq/ui/style.css',
    '~/assets/css/site.css',
  ],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
      meta: [
        { name: 'color-scheme', content: 'light dark' },
        { name: 'description', content: SITE_DESCRIPTION },
      ],
      script: [{
        tagPosition: 'head',
        innerHTML: `try{var t=localStorage.getItem('ui-theme');var dark=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.classList.toggle('dark',dark)}catch(e){}`,
      }],
    },
  },

  build: {
    transpile: ['@froq/ui'],
  },

  vite: {
    server: {
      fs: { allow: ['..'] },
    },
  },

  content: {
    experimental: { sqliteConnector: 'native' },
    build: {
      markdown: {
        highlight: {
          theme: { default: 'vitesse-light', dark: 'vitesse-dark' },
          langs: ['ts', 'vue', 'bash', 'css', 'json'],
        },
      },
    },
  },

  i18n: {
    locales: [
      { code: 'en', language: 'en', name: 'English', file: 'en.json' },
      { code: 'zh', language: 'zh-CN', name: '中文', file: 'zh.json' },
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    baseUrl: IMAGE_ORIGIN,
  },

  nitro: {
    // Workers Builds sets WORKERS_CI; without this Nitro picks cloudflare-module.
    preset: 'static',
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/zh',
        '/components',
        '/zh/components',
        ...componentRoutes(),
      ],
    },
  },

  $production: {
    nitro: {
      // Workers static assets read repo-root `dist`; dev must not empty that output.
      output: {
        dir: siteDist,
        publicDir: siteDist,
      },
    },
  },

  typescript: { strict: true },

  eslint: { config: { standalone: false } },
})
