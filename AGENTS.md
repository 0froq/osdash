# osdash

- 默认中文回复。
- 这是只读看板。不要加写 GitHub、合并、发评论的功能。
- 不对 UI 写测试。验收用 `vp run check`、`vp run test`，以及手动看页面。

## 工具链

照 lig 当前 main 的做法：

- Nuxt、pnpm catalog、Vite+（`vp`）。脚本用 `vp run <script>`，不要用 Vite+ 自带的 `vp dev` / `vp build` / `vp check`。
- 测试配置在 `tooling/vite.config.ts`，命令是 `vp run test`。不要在仓库根加一份 Nuxt 不会读的 Vite 配置。
- Lint 用 Oxlint（`.oxlintrc.json`），格式化用 Oxfmt（`.oxfmtrc.json`）。脚本显式传入配置路径。
- `simple-git-hooks` + `lint-staged`。
- Node 24.21.0，写在 `.node-version` 和 `mise.toml`。`engines` 是 `^24.21.0 || >=26.0.0`。
- 不使用 ESLint，不运行 wrangler 命令。`wrangler` 留在 devDependency 里，是因为预览适配和 Nitro 的 Cloudflare 预设会读它的配置类型；命令本身不要用。

## 部署

生产走 Void。`void.config.ts` 是事实源。`pnpm deploy` 就是 `void deploy --platform cloudflare`，由 Void 自己跑 `inference.build`，不要再手动串一次 build。

分支预览是 `pnpm preview:deploy`：先 `nuxt build`，再 `cf previews deploy`。`cloudflare.config.ts` 只做预览适配，从 `void.config.ts` 读 name、兼容日期、兼容旗标、observability、`workers_dev`、`preview_urls`。生产自定义域名只留在 Void 配置里，预览适配器不写 `routes`，避免把 `osdash.froq.me` 挂到分支预览上。

GitHub Actions 只跑 check 和 test，不发布。

### 非静态 appType，查到的做法

依据（2026-10-19 读到的文档，不是这次仓库里跑通过的部署）：

- [Supported App Types](https://void.cloud/guide/app-types)：`inference.appType` 可以是 `"void"`、`"framework"`、`"spa"`、`"static"`。Nuxt 属于 meta-framework，对应 `"framework"`。`"static"` 只上传静态文件，没有 Worker。
- [Nuxt integration](https://void.cloud/integrations/frameworks/nuxt)：Nitro `preset: 'cloudflare-module'`，开发时 `nitro.cloudflare.dev.configPath` 指向 `./.void-wrangler.jsonc`。`vite` 里加 `voidPlugin()`。绑定从 `event.context.cloudflare.env` 读。
- [Config](https://void.cloud/reference/config)：`inference.bindings.kv` 接受 `true`（默认名 `KV`）或字符串自定义名。这里写成 `'CACHE'`。`kv_namespaces` 这类带 id 的数组放在 `cloudflare` 里；id 要等 Void 第一次部署写进 `void.lock.json`。没有真实部署，所以这里不编一个 namespace id。
- [Environment variables](https://void.cloud/guide/env-vars)：secret 在根目录 `env.ts` 用 `defineEnv` 声明。没有 `VITE_` 前缀的键是服务端值。生产用 `void secret put GITHUB_TOKEN`，不要写进 `void.config.ts` 的 `vars`。本地值放 `.env`，`.env` 不进 git，也不会被 deploy 上传。
- [cf programmatic config](https://developers.cloudflare.com/cf/projects/cloudflare-config/)：会跑代码的 Worker 需要 `entrypoint`。KV 用 `bindings.kv()`，secret 用 `bindings.secret()`，都挂在 `worker.env` 下。预览适配器因此声明了 `CACHE` 和 `GITHUB_TOKEN`，入口指向 Nitro `cloudflare-module` 的 `.output/server/index.mjs`。`assets.notFoundHandling: 'none'`、`runWorkerFirst: true`，让 server route 由 Worker 处理。

本地 `nuxt build`（Nitro preset `cloudflare-module`）已经跑通，产物是 `.output/server/index.mjs`，旁边有 `.output/public`。入口文件会 import `node:*` 和 `cloudflare:workers`，所以运行时需要 `nodejs_compat`。这次构建没有写出 `.output/server/wrangler.json`：Nitro 只在 provider 被识别成 `cloudflare_workers` 时才默认打开 `deployConfig`。

Nitro 不会读 `void.config.ts` 或 `wrangler.config.ts` 来判断要不要开 Node 兼容。它只扫 `wrangler.json`、`wrangler.jsonc`、`wrangler.toml`。第一次构建因此警告 `Node.js compatibility is not enabled`。`nuxt.config.ts` 里显式写了 `nitro.cloudflare.nodeCompat: true`，第二次构建不再警告，并把 `nodejs_compat` 编进 Worker。Void 配置里的 `compatibility_flags` 仍然要留着，那是部署时交给 Cloudflare 的旗标，不是 Nitro 的构建开关。

页面引用共享逻辑要用 `#shared/turn`。写成相对路径时，编出来的页面 chunk 会在 `.nuxt` 缓存目录里找不到 `shared/turn.ts`，Nitro 直接构建失败。

没有在这个环境里执行 `void deploy` 或 `cf previews deploy`（没有 Cloudflare 凭据）。Void 是否会按 `framework` 吃下这份 Nitro 产物、以及 `bindings.kv()` 不带 id 时预览会不会自己建 namespace，都还没被一次真实发布证实。

本地构建时 Void 写过一份 `void.lock.json`。`resolved.kv_namespaces` 里 binding 是 `CACHE`，id 是字符串 `local`。这不是 Cloudflare 分配的 namespace id，提交进去会让以后的部署以为 namespace 已经存在。那份文件已删掉，等第一次真正的 `void deploy` 写出真实 id 再提交。

`wrangler.config.ts` 的 `assetsDirectory: './.output/public'` 沿 lig 的预览适配留下；cf 文档说有 `cloudflare.config.ts` 时构建不一定读这份 Wrangler 配置。Nitro 构建日志会建议 `npx wrangler`，这个仓库不跑那条命令。

本地 KV：Nitro 的 `cloudflare.wrangler.kv_namespaces` 写了 binding `CACHE` 和占位 id `local-osdash-cache`，只给 dev 的本地模拟用。没有 binding 时，`server/cache.ts` 退回进程内 Map，TTL 仍是 10 分钟。

## 数据

- `server/github.ts` 用 GitHub GraphQL。查询是 `author:0froq -user:0froq`，PR 和 issue 分开搜：开着的，或 `closed:>=` 14 天前。每种最多 5 页、每页 20 条。
- 判断在 `shared/turn.ts` 的 `judge`。创建本身算作者的一条真人动静。bot：`__typename == Bot`，login 以 `[bot]` 结尾，或 login 在 `coderabbitai`、`codecov`、`netlify`、`vercel`、`coldtea-pr-lens`、`chatgpt-codex-connector`。
- 轮到谁按这个顺序停：已合并或已关闭；有真实 CI 失败；最新一条已提交的 review 是 `CHANGES_REQUESTED` 且之后 0froq 没有 push；最后一条真人动静不是 0froq；否则等维护者。`PENDING` 的 review 不算「最新一条已提交的 review」。
- Vercel / Netlify 的预览、部署、授权类失败不算真实 CI 失败。lint 失败算。
- CI 还在排队、进行中、等待，或 conclusion 是 `ACTION_REQUIRED` 时加「CI 待批」。
- 等待从最后一条真人动静算。只有「等维护者」上色：超过 7 天黄，超过 14 天红。刚好 7 天、刚好 14 天不上更深的颜色。
- 平均首次回复：别人（不是 0froq、不是 bot）第一条非创建动静减去创建时间。没有回复的不进平均。
- `?refresh=1` 跳过 KV。开发时页面带 `mock=1`，生产构建里 `import.meta.dev` 为假，样例不会打开。
- Notion 只在 `server/notion.ts`。`createNotionSource().connected` 是 `false`，不发请求。
