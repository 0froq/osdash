---
name: library-development
description: Library bundling with tsdown and pure ESM publishing. Use when creating npm packages.
---

# Library Development

## Bundling with tsdown

Use [tsdown](https://github.com/rolldown/tsdown) for TypeScript library bundling (powered by Rolldown).

### Installation

```bash
pnpm add -D tsdown
```

### Configuration

```ts
// tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  outDir: 'dist',
  format: ['esm'],  // Pure ESM
  dts: true,        // Generate declarations
  clean: true,      // Clean outDir before build
  splitting: true,  // Code splitting
  minify: false,    // Keep readable for debugging
})
```

### Package.json

```json
{
  "name": "@myorg/my-lib",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch",
    "prepack": "pnpm build"
  }
}
```

## Pure ESM

Publish only ESM (no CommonJS):

```json
{
  "type": "module"
}
```

Benefits:
- Smaller bundle size
- Tree-shaking support
- Native async imports
- Future-proof

## Export Patterns

### Named Exports

```ts
// src/index.ts
export { foo, bar } from './foo'
export type { FooOptions } from './types'
export { default as MyComponent } from './MyComponent.vue'
```

### Subpath Exports

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./utils": {
      "types": "./dist/utils.d.ts",
      "import": "./dist/utils.js"
    },
    "./package.json": "./package.json"
  }
}
```

Usage:
```ts
import { foo } from 'my-lib'
import { util } from 'my-lib/utils'
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
    "declaration": true,
    "declarationMap": true,
    "noEmit": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

## Testing Libraries

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
})
```

## GitHub Actions for Release

See [release-workflow](release-workflow.md) for automated releases.

## Versioning Strategy

Follow semantic versioning:

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

Use conventional commits for automatic changelog generation.
