---
name: oq-eslint-config
description: Custom @antfu/eslint-config setup with specific Vue formatting rules and dprint for markdown. Use when configuring ESLint for oQ-style projects.
---

# oQ's ESLint Configuration

Based on `@antfu/eslint-config` with personal customizations for Vue projects and specific formatting preferences.

## Base Configuration

```ts
// eslint.config.ts
import antfu from '@antfu/eslint-config'
import nuxt from './.nuxt/eslint.config.mjs'

export default antfu(
  {
    unocss: true,
    pnpm: true,
    typescript: true,
    vue: true,
    rules: {
      // Vue template formatting - one attribute per line
      'vue/max-attributes-per-line': ['error', {
        singleline: { max: 1 },
        multiline: { max: 1 },
      }],
      // Disable unused imports auto-removal (manual cleanup preferred)
      'unused-imports/no-unused-imports': 'off',
    },
    formatters: {
      css: true,      // Format CSS, LESS, SCSS
      html: true,     // Format HTML
      markdown: 'dprint'  // Use dprint for markdown (not prettier)
    },
  },
)
  .append(nuxt())  // Append Nuxt's ESLint config if using Nuxt
```

## Key Customizations

### Vue Template Formatting

Strict attribute-per-line enforcement for Vue templates:

```vue
<!-- ❌ Bad: Multiple attributes on one line -->
<div class="foo" id="bar" @click="handle">

<!-- ✅ Good: One attribute per line -->
<div
  class="foo"
  id="bar"
  @click="handle"
>
```

### Unused Imports

Unlike the default antfu config, unused imports are NOT automatically removed. This allows for:
- Intentional side-effect imports
- Gradual refactoring without breaking builds
- Manual review of what to remove

### Markdown Formatting

Uses **dprint** instead of Prettier for markdown files:
- Faster formatting
- Better control over formatting rules
- Consistent with modern tooling

## Required Dependencies

```bash
# Core
pnpm add -D @antfu/eslint-config

# For Nuxt projects
pnpm add -D @nuxt/eslint

# Formatters (CSS/HTML/Markdown)
pnpm add -D eslint-plugin-format

# If using dprint for markdown
pnpm add -D dprint
```

## Formatters Setup

### dprint Configuration (Optional)

Create `dprint.json` for markdown formatting:

```json
{
  "typescript": {},
  "json": {},
  "markdown": {
    "lineWidth": 100,
    "deno": true
  },
  "excludes": [
    "**/node_modules",
    "**/.nuxt",
    "**/dist"
  ],
  "plugins": [
    "https://plugins.dprint.dev/typescript-0.88.0.wasm",
    "https://plugins.dprint.dev/json-0.19.0.wasm",
    "https://plugins.dprint.dev/markdown-0.16.0.wasm"
  ]
}
```

## VS Code Settings

Add to `.vscode/settings.json`:

```jsonc
{
  "prettier.enable": false,
  "editor.formatOnSave": false,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },
  "eslint.rules.customizations": [
    { "rule": "style/*", "severity": "off", "fixable": true },
    { "rule": "format/*", "severity": "off", "fixable": true },
    { "rule": "*vue/max-attributes-per-line", "severity": "error", "fixable": true }
  ],
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue",
    "html",
    "markdown",
    "json",
    "jsonc",
    "yaml",
    "css",
    "less",
    "scss"
  ]
}
```

## Running ESLint

```bash
# Lint and fix
pnpm run lint --fix

# Check only
pnpm run lint
```

## Additional Rule Overrides

If needed, add overrides after the main config:

```ts
export default antfu({
  // ... base config
})
  .append(nuxt())
  .override('my-custom-rules', {
    files: ['**/*.vue'],
    rules: {
      // Additional Vue-specific rules
    },
  })
```

<!--
Source references:
- https://github.com/antfu/eslint-config
- https://github.com/antfu/eslint-config#readme
-->
