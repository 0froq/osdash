import { defineConfig } from '@x18n/core'

export default defineConfig({
  sourceLocale: 'en',
  resources: [{ pattern: 'docs/i18n/locales/{locale}.json' }],
  usage: {
    include: ['docs/app/**/*.vue', 'docs/app/**/*.ts'],
    calls: [{ callee: ['t', '$t'] }],
    // Keys the site reads through app.config.ts and the component catalog, not through t('…').
    keysInUse: ['nav.*', 'docs.groups.*', 'docs.prev', 'components.sections.*'],
  },
})
