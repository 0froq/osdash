import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['README.md', 'AGENTS.md', 'docs/**', 'dist/**'],
  pnpm: true,
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
    markdown: 'dprint',
  },
}, {
  files: ['package.json'],
  rules: {
    // file: consumers cannot resolve this workspace's runtime catalog protocols.
    // Keep runtime dependencies portable; catalog enforcement still covers dev tools.
    'pnpm/json-enforce-catalog': ['error', { fields: ['devDependencies'] }],
  },
})
