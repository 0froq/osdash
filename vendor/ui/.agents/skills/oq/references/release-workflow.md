---
name: release-workflow
description: Automated GitHub releases using changelogithub. Use when setting up release automation for oQ-style projects.
---

# Release Workflow

Automated GitHub releases using [changelogithub](https://github.com/antfu/changelogithub) by Anthony Fu.

## What is changelogithub?

Generates beautiful changelogs from conventional commits and creates GitHub releases automatically.

- Parses conventional commits
- Groups changes by type (features, fixes, etc.)
- Generates markdown changelog
- Creates GitHub releases with notes
- Cross-references issues and PRs

## GitHub Actions Workflow

**`.github/workflows/release.yml`**:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm run build

      - name: Release
        run: npx changelogithub
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Conventional Commits

changelogithub parses conventional commits. Follow this format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description | Changelog Section |
|------|-------------|-------------------|
| `feat` | New feature | ✨ Features |
| `fix` | Bug fix | 🐞 Bug Fixes |
| `docs` | Documentation changes | 📖 Documentation |
| `style` | Code style changes | 🎨 Styles |
| `refactor` | Code refactoring | 🏗 Refactoring |
| `perf` | Performance improvements | ⚡ Performance |
| `test` | Adding/updating tests | 🧪 Tests |
| `chore` | Build/process changes | 🛠 Chore |

### Examples

```bash
# Feature
feat: add user authentication

# Bug fix
fix(api): resolve null pointer exception

# Breaking change
feat!: redesign API response format

# With scope and body
feat(auth): implement OAuth2 login

Adds support for Google and GitHub OAuth2 providers.
Closes #123
```

## Versioning

Use semantic versioning for tags:

```bash
# Patch release (bug fixes)
git tag v1.0.1

# Minor release (features, backwards compatible)
git tag v1.1.0

# Major release (breaking changes)
git tag v2.0.0
```

## Release Process

1. **Ensure all changes are committed** with conventional commit messages
2. **Update version** in package.json (if applicable)
3. **Create and push tag**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. **GitHub Actions automatically**:
   - Runs build
   - Generates changelog
   - Creates GitHub release

## Changelog Preview

Generated changelog includes:

- ✨ Features
- 🐞 Bug Fixes
- 🏗 Refactoring
- 📖 Documentation
- 🧪 Tests
- ⚡ Performance
- 🎨 Styles
- 🛠 Chore

## Custom Configuration

Create `changelogithub.config.ts` for customization:

```ts
import { defineConfig } from 'changelogithub'

export default defineConfig({
  // Filter commits
  types: {
    feat: { title: '🚀 Features' },
    fix: { title: '🐛 Bug Fixes' },
    docs: { title: '📚 Documentation' },
  },
  
  // Exclude certain commits
  excludeScopes: ['deps', 'ci'],
  
  // Custom contributors section
  contributors: true,
})
```

## Alternative: sxzz/workflows

For a simpler setup, use the reusable workflow:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    uses: sxzz/workflows/.github/workflows/release.yml@v1
    with:
      publish: true
    permissions:
      contents: write
      id-token: write
```

This uses changelogithub internally with sensible defaults.

## Required Permissions

Ensure GitHub Actions has write permissions:

1. Go to **Settings → Actions → General**
2. Under **Workflow permissions**, select:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

## Troubleshooting

### No changelog generated

- Ensure commits follow conventional commit format
- Check that tags follow semantic versioning (`v*.*.*`)
- Verify GITHUB_TOKEN has write permissions

### Missing entries

- Only commits since last tag are included
- Squash merges preserve commit messages from the PR
- Use `!` suffix for breaking changes

<!--
Source references:
- https://github.com/antfu/changelogithub
- https://www.conventionalcommits.org/
-->
