import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { countCardWords } from '@froq/og-covers-layer/card-words'
import { X18nDevtools } from '@x18n/devtools/vite'
import { componentFile } from './app/utils/component-files'
import { keepEmptyTitle } from './app/utils/empty-title'
import { listPublicShareImages } from './app/utils/public-files'
import { IMAGE_ORIGIN, SITE_DESCRIPTION, SITE_NAME } from './app/utils/site'
import ligThemes from './app/assets/lig-themes.json'

const siteDist = fileURLToPath(new URL('../dist', import.meta.url))
const componentsRoot = fileURLToPath(new URL('../src/components', import.meta.url))

function componentRoutes(): string[] {
  const routes: string[] = []
  for (const concept of readdirSync(componentsRoot, { withFileTypes: true })) {
    if (!concept.isDirectory()) continue
    routes.push(
      `/components/${concept.name}`,
      `/zh/components/${concept.name}`,
      `/ja/components/${concept.name}`,
    )
    const files = readdirSync(
      fileURLToPath(new URL(`../src/components/${concept.name}`, import.meta.url)),
    )
    for (const file of files) {
      const entry = componentFile(`${concept.name}/${file}`)
      if (!entry || entry.demo) continue
      routes.push(entry.to, `/zh${entry.to}`, `/ja${entry.to}`)
    }
  }
  return routes
}

// @ts-expect-error the og-covers layer's NuxtConfigInput generic overflows the checker
export default defineNuxtConfig({
  extends: ['@froq/og-covers-layer'],

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

  modules: ['@nuxt/content', '@nuxtjs/i18n'],

  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },

  // `og:image` is absolute on this origin. `og:url` stays on ui.froq.me via useShareMeta.
  site: {
    url: IMAGE_ORIGIN,
    name: SITE_NAME,
  },

  css: ['~/assets/css/fonts.css', '@froq/ui/tokens.css', '~/assets/css/site.css'],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
      meta: [
        { name: 'color-scheme', content: 'light dark' },
        { name: 'description', content: SITE_DESCRIPTION },
      ],
      script: [
        {
          tagPosition: 'head',
          innerHTML: `try{var t=localStorage.getItem('ui-theme');var dark=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.classList.toggle('dark',dark)}catch(e){}`,
        },
      ],
    },
  },

  build: {
    transpile: ['@froq/ui'],
  },

  vite: {
    server: {
      fs: { allow: ['..'] },
    },
    plugins: [X18nDevtools()],
  },

  content: {
    experimental: { sqliteConnector: 'native' },
    build: {
      markdown: {
        highlight: {
          theme: {
            default: ligThemes.default as never,
            dark: ligThemes.dark as never,
          },
          langs: ['ts', 'vue', 'bash', 'css', 'json'],
        },
      },
    },
  },

  i18n: {
    locales: [
      { code: 'en', language: 'en', name: 'English', file: 'en.json' },
      { code: 'zh', language: 'zh-CN', name: '中文', file: 'zh.json' },
      { code: 'ja', language: 'ja-JP', name: '日本語', file: 'ja.json' },
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
        '/ja',
        '/components',
        '/zh/components',
        '/ja/components',
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
})
