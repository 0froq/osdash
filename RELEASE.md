# Release `@froq/ui`

## 0.1.0 (first npm publish)

First public release on npm under the `@froq` scope. The package ships TypeScript and Vue source; consumers compile it with Vite or Nuxt (`build.transpile: ['@froq/ui']`). Runtime peer: `vue` ^3.5.0 (optional for `@froq/ui/core` only).

### After merge: publish to npm

Maintainer only. Do not publish from CI or cloud agents.

1. Confirm [main](https://github.com/0froq/ui) is green and `package.json` `version` is **0.1.0**.
2. Use Node **24.21.0** (`.node-version` / `mise.toml`) and pnpm **12.11.2** (`packageManager` in `package.json`).
3. From the repo root:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm pack --pack-destination /tmp
tar -tzf /tmp/froq-ui-0.1.0.tgz | head
```

4. Log in as the **froq** npm user (org **`@froq`**):

```bash
npm whoami
# expect: froq
```

5. Publish (public scoped package):

```bash
npm publish --access public
```

6. Tag the release in git (optional but recommended):

```bash
git tag v0.1.0
git push origin v0.1.0
```

7. Update [ui.froq.me](https://ui.froq.me) changelog if the docs site should mention the npm install path (`pnpm add @froq/ui`).

### Publish readiness checklist

| Item                                             | Status                                           |
| ------------------------------------------------ | ------------------------------------------------ |
| `name` is `@froq/ui`                             | yes                                              |
| `private` is false                               | yes                                              |
| `publishConfig.access` is `public`               | yes                                              |
| `files` includes publishable `src/`              | yes                                              |
| `exports` for `.`, `./core`, `./vue`, CSS        | yes                                              |
| Runtime deps use registry ranges (no `catalog:`) | yes                                              |
| `engines.node` ^24.21.0 \|\| >=26.0.0            | yes                                              |
| Not yet on npm (first publish)                   | confirm before publish                           |
| Root `LICENSE` / license field                   | MIT; signature assets remain SIL OFL 1.1 in tree |
