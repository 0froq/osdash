---
name: setting-up
description: Project setup files including .gitignore, GitHub Actions workflows, VS Code extensions, and font loading. Use when initializing new projects with oQ's style.
---

# Project Setup

## .gitignore

Create when `.gitignore` is not present:

```
*.log
*.tgz
.cache
.DS_Store
.eslintcache
.idea
.env
.env.local
.env.*.local
.nuxt
.temp
.output
.turbo
cache
coverage
dist
lib-cov
logs
node_modules
temp
```

## GitHub Actions

### Autofix Workflow

**`.github/workflows/autofix.yml`** - Auto-fix linting on PRs:

```yaml
name: autofix.ci

on: [pull_request]

jobs:
  autofix:
    uses: sxzz/workflows/.github/workflows/autofix.yml@v1
    permissions:
      contents: read
```

### Unit Test Workflow

**`.github/workflows/unit-test.yml`** - Run tests on push/PR:

```yaml
name: Unit Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions: {}

jobs:
  unit-test:
    uses: sxzz/workflows/.github/workflows/unit-test.yml@v1
```

### Release Workflow

See [release-workflow](release-workflow.md) for changelogithub setup.

## VS Code Extensions

Configure in `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "antfu.pnpm-catalog-lens",
    "antfu.iconify",
    "antfu.unocss",
    "antfu.slidev",
    "vue.volar"
  ]
}
```

| Extension | Description |
|-----------|-------------|
| `dbaeumer.vscode-eslint` | ESLint integration for linting and formatting |
| `antfu.pnpm-catalog-lens` | Shows pnpm catalog version hints inline |
| `antfu.iconify` | Iconify icon preview and autocomplete |
| `antfu.unocss` | UnoCSS IntelliSense and syntax highlighting |
| `antfu.slidev` | Slidev preview and syntax highlighting |
| `vue.volar` | Vue Language Features |

## Font Loading

### Local Fonts

For LXGW Neo ZhiSong Plus, YshiPen-ShutiTC, and LXGW Bright Code TC:

1. Place font files in `assets/fonts/`
2. Create CSS `@font-face` declarations:

```css
/* assets/fonts/fonts.css */
@font-face {
  font-family: 'LXGW Neo ZhiSong Plus';
  src: url('./LXGWNeoZhiSongPlus-Regular.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'YshiPen-ShutiTC';
  src: url('./YshiPen-ShutiTC-Regular.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'LXGW Bright Code TC';
  src: url('./LXGWBrightCodeTC-Regular.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

3. Import in your app entry:

```ts
// main.ts or app.vue
import '~/assets/fonts/fonts.css'
```

### Google Fonts

For Caveat and Ephesis, add to your HTML head:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Ephesis&display=swap" rel="stylesheet">
```

Or via Nuxt configuration:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Ephesis&display=swap' },
      ],
    },
  },
})
```

## package.json Scripts

Standard scripts for oQ-style projects:

```json
{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "lint": "eslint . --cache --concurrency=auto",
    "lint:fix": "eslint . --cache --concurrency=auto --fix",
    "postinstall": "nuxt prepare",
    "prepare": "npx simple-git-hooks"
  }
}
```

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "~/*": ["./*"],
      "@/*": ["./*"]
    }
  },
  "exclude": ["node_modules", ".nuxt", "dist"]
}
```
