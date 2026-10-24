import antfu from '@antfu/eslint-config'
import nuxt from './.nuxt/eslint.config.mjs'

export default antfu(
  {
    // Markdown formatters rewrite MDC `---` prop blocks into setext headings.
    ignores: ['content/**', '.nuxt/**', '.data/**'],
    typescript: true,
    vue: true,
    rules: {
      'vue/max-attributes-per-line': ['error', {
        singleline: { max: 1 },
        multiline: { max: 1 },
      }],
      'unused-imports/no-unused-imports': 'off',
    },
    formatters: {
      css: true,
      html: true,
    },
  },
)
  .append(nuxt())
