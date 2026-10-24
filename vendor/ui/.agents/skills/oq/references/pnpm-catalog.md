---
name: pnpm-catalog
description: pnpm catalog configuration and management tools. Use when setting up workspace dependency management with strict catalog conventions.
---

# pnpm Catalog Configuration

Strict pnpm catalog setup for consistent dependency management across workspaces.

## What is pnpm Catalog?

A centralized dependency version management system for pnpm workspaces. Instead of specifying versions in each package's `package.json`, you define them once in `pnpm-workspace.yaml`.

**Benefits:**
- Single source of truth for dependency versions
- Easy bulk updates
- Prevents version drift across packages
- Automatic deduplication

## Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
  - 'apps/*'

# Named catalogs - NEVER use default catalog
catalog:
  # Production dependencies
  prod:
    vue: ^3.5.0
    pinia: ^2.2.0
    vue-router: ^4.4.0
    
  # Bundler inlined dependencies
  inlined:
    defu: ^6.1.4
    scule: ^1.3.0
    
  # Dev tools
  dev:
    typescript: ^5.6.0
    eslint: ^9.0.0
    vitest: ^2.1.0
    
  # Frontend libraries
  frontend:
    '@vueuse/core': ^11.0.0
    '@vueuse/head': ^2.0.0
```

### Using Catalog Dependencies

In package.json, use `catalog:` protocol:

```json
{
  "dependencies": {
    "vue": "catalog:prod",
    "pinia": "catalog:prod",
    "defu": "catalog:inlined",
    "@vueuse/core": "catalog:frontend"
  },
  "devDependencies": {
    "typescript": "catalog:dev",
    "vitest": "catalog:dev"
  }
}
```

### Catalog Protocol Syntax

```json
{
  "package-name": "catalog:"           // Use default catalog (AVOID)
  "package-name": "catalog:prod",      // Use 'prod' named catalog
  "package-name": "catalog:dev"        // Use 'dev' named catalog
}
```

## Catalog Organization Strategy

### Recommended Categories

| Catalog | Purpose | Examples |
|---------|---------|----------|
| `prod` | Production runtime deps | vue, pinia, vue-router |
| `inlined` | Bundled/inlined deps | defu, scule, pathe |
| `dev` | Development tools | typescript, eslint, vitest |
| `frontend` | UI/frontend libraries | @vueuse/core, unocss |
| `backend` | Server-side deps | h3, nitro, @trpc/server |
| `testing` | Testing utilities | @vue/test-utils, cypress |

### Catalog Selection Rules

1. **NEVER use the default catalog** - Always use named catalogs
2. **Group by function** - Similar purposes in same catalog
3. **Consider bundle size** - Separate inlined vs external deps
4. **Update frequency** - Group deps that update together

## pnpm-workspace-utils

Anthony Fu's tool for managing pnpm workspaces and catalogs.

### Installation

```bash
pnpm add -D pnpm-workspace-utils
```

### Usage

```bash
# Check for catalog inconsistencies
pnpm exec pnpm-workspace-utils check

# Update catalog versions interactively
pnpm exec pnpm-workspace-utils update

# Sync catalog to all packages
pnpm exec pnpm-workspace-utils sync
```

### Features

- Detects packages using non-catalog versions
- Shows outdated catalog entries
- Interactive version updates
- Validates workspace consistency

## nip - Interactive Package Manager

Interactive tool for managing dependencies in pnpm workspaces.

### Installation

```bash
pnpm add -D @antfu/nip
```

### Usage

```bash
# Interactive dependency management
pnpm exec nip

# Add dependency to specific workspace
pnpm exec nip add vue --workspace=apps/web

# Update dependencies interactively
pnpm exec nip update

# Remove dependency
pnpm exec nip remove lodash
```

### Features

- Interactive UI for dependency management
- Workspace-aware operations
- Bulk add/remove/update
- Catalog integration

## VS Code Integration

### pnpm-catalog-lens Extension

Shows catalog version hints inline:

```json
// .vscode/extensions.json
{
  "recommendations": [
    "antfu.pnpm-catalog-lens"
  ]
}
```

Features:
- Inline version hints
- Click to navigate to catalog definition
- Highlights non-catalog dependencies

## Workflow

### Adding a New Dependency

1. **Check if it exists** in catalog:
   ```bash
   cat pnpm-workspace.yaml | grep package-name
   ```

2. **If exists**: Use catalog protocol in package.json
   ```json
   { "package-name": "catalog:prod" }
   ```

3. **If new**: Add to appropriate catalog first
   ```yaml
   catalog:
     prod:
       package-name: ^1.0.0
   ```

4. **Then install**:
   ```bash
   pnpm install
   ```

### Updating Dependencies

1. **Check status**:
   ```bash
   pnpm exec pnpm-workspace-utils check
   ```

2. **Update catalog versions**:
   ```bash
   pnpm exec pnpm-workspace-utils update
   ```

3. **Or manually** edit `pnpm-workspace.yaml`

4. **Install updates**:
   ```bash
   pnpm update
   ```

### Migration to Catalog

Convert existing dependencies to use catalog:

```bash
# Check for non-catalog deps
pnpm exec pnpm-workspace-utils check

# Shows recommendations for migration
# Manually update package.json files to use catalog: protocol
```

## Common Patterns

### Lockfile Maintenance

```json
{
  "scripts": {
    "clean": "rm -rf node_modules pnpm-lock.yaml",
    "fresh": "pnpm clean && pnpm install",
    "check-catalog": "pnpm-workspace-utils check"
  }
}
```

### CI/CD with Catalog

```yaml
# .github/workflows/ci.yml
- name: Install dependencies
  run: pnpm install --frozen-lockfile

# Lockfile ensures catalog versions are respected
```

## Best Practices

1. **Always use named catalogs** - Never rely on default catalog
2. **Keep catalogs organized** - Group by purpose/function
3. **Regular consistency checks** - Run `pnpm-workspace-utils check`
4. **Document catalog categories** - Add comments in pnpm-workspace.yaml
5. **Update systematically** - Use tools for bulk updates
6. **Pin critical versions** - For sensitive deps, use exact versions

## Troubleshooting

### Dependency not found

```bash
# Ensure catalog is defined
pnpm exec pnpm-workspace-utils check

# Reinstall to pick up catalog changes
rm -rf node_modules pnpm-lock.yaml && pnpm install
```

### Version conflicts

```bash
# Check which packages use different versions
pnpm why package-name

# Update catalog to resolve
pnpm exec pnpm-workspace-utils update
```

<!--
Source references:
- https://pnpm.io/catalogs
- https://github.com/antfu/pnpm-workspace-utils
- https://github.com/antfu/nip
-->
