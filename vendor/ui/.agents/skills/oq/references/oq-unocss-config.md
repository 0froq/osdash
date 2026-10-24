---
name: oq-unocss-config
description: Custom UnoCSS configuration with specific fonts, prefixed attributify, and icon collections. Use when setting up UnoCSS for oQ-style projects.
---

# oQ's UnoCSS Configuration

Personalized UnoCSS setup with custom fonts, prefixed attributify mode, and curated icon collections.

## Configuration

```ts
// uno.config.ts
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTagify,
  presetTypography,
  presetWind4,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

// Optional: For Markdown support
// import extractorMdc from '@unocss/extractor-mdc'

export default defineConfig({
  theme: {
    breakpoints: {
      sm: '600px',
      md: '900px',
    },
  },
  rules: [
    // Local fonts - place font files in assets/fonts/
    ['font-sans', { 'font-family': 'LXGW Neo ZhiSong Plus' }],
    ['font-serif', { 'font-family': 'YshiPen-ShutiTC' }],
    ['font-mono', { 'font-family': 'LXGW Bright Code TC' }],
    // Google Fonts - loaded via Google Fonts CDN
    ['font-stylish', { 'font-family': 'Caveat' }],
    ['font-script', { 'font-family': 'Ephesis' }],
  ],
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html|css)($|\?)/,
      ],
    },
  },
  shortcuts: {
    'page-content': 'mx-auto max-w-[800px] block px-10 min-w-0',
  },
  presets: [
    presetWind4(),
    presetIcons({
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json', { with: { type: 'json' } }).then(i => i.default),
        solar: () => import('@iconify-json/solar/icons.json', { with: { type: 'json' } }).then(i => i.default),
        openmoji: () => import('@iconify-json/openmoji/icons.json', { with: { type: 'json' } }).then(i => i.default),
      },
    }),
    presetAttributify({
      strict: true,
      prefixedOnly: true,  // Only match `un-` prefixed attributes
      prefix: 'un-',
    }),
    presetTagify({
      prefix: 'un-',
    }),
    presetTypography(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  extractors: [
    // Uncomment for Markdown support
    // extractorMdc(),
  ],
  layers: {
    default: 0,
    components: 1,
    utilities: 2,
  },
})
```

## Key Features

### Custom Fonts

Five font families configured:

| Class | Font | Type | Source |
|-------|------|------|--------|
| `font-sans` | LXGW Neo ZhiSong Plus | Sans-serif | Local files in `assets/fonts/` |
| `font-serif` | YshiPen-ShutiTC | Serif | Local files in `assets/fonts/` |
| `font-mono` | LXGW Bright Code TC | Monospace | Local files in `assets/fonts/` |
| `font-stylish` | Caveat | Handwriting | Google Fonts CDN |
| `font-script` | Ephesis | Script | Google Fonts CDN |

### Prefixed Attributify Mode

Uses `un-` prefix to avoid conflicts with other libraries:

```html
<!-- ❌ Standard attributify (disabled) -->
<div bg-red-500 text-white p-4></div>

<!-- ✅ Prefixed attributify (enabled) -->
<div un-bg-red-500 un-text-white un-p-4></div>
```

Benefits:
- Avoids conflicts with Vue props or HTML attributes
- Clear separation of UnoCSS utilities
- Strict mode ensures only valid utilities work

### Icon Collections

Three curated icon sets:

- **carbon**: IBM Carbon Design System icons
- **solar**: Solar icons by 480 Design
- **openmoji**: OpenMoji open source emojis

Usage:
```html
<div class="i-carbon-close"></div>
<div class="i-solar-home"></div>
<div class="i-openmoji-rocket"></div>
```

### Shortcuts

Pre-defined shortcuts for common patterns:

```html
<!-- `page-content` shortcut -->
<main class="page-content">
  <!-- Equivalent to: mx-auto max-w-[800px] block px-10 min-w-0 -->
</main>
```

## Dependencies

```bash
# Core UnoCSS
pnpm add -D unocss

# Presets
pnpm add -D @unocss/preset-attributify
pnpm add -D @unocss/preset-icons
pnpm add -D @unocss/preset-tagify
pnpm add -D @unocss/preset-typography
pnpm add -D @unocss/preset-wind4

# Transformers
pnpm add -D @unocss/transformer-directives
pnpm add -D @unocss/transformer-variant-group

# Icon collections
pnpm add -D @iconify-json/carbon
pnpm add -D @iconify-json/solar
pnpm add -D @iconify-json/openmoji

# Optional: Markdown support
# pnpm add -D @unocss/extractor-mdc
```

## Vite/Nuxt Integration

### Vite

```ts
// vite.config.ts
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    UnoCSS(),
  ],
})
```

### Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@unocss/nuxt',
  ],
  unocss: {
    // Config loaded from uno.config.ts automatically
  },
})
```

## Custom Breakpoints

Custom responsive breakpoints:

| Breakpoint | Width |
|------------|-------|
| `sm` | 600px |
| `md` | 900px |

Usage:
```html
<div class="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"></div>
```

## Layers

CSS layer ordering:

1. `default` (0) - Base styles
2. `components` (1) - Component-specific styles
3. `utilities` (2) - Utility classes (highest specificity)

<!--
Source references:
- https://unocss.dev/
- https://github.com/unocss/unocss
-->
