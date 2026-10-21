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

`workers_dev` 是 `false`，生产不挂 `*.workers.dev`。`preview_urls` 显式保持 `true`。Cloudflare 的默认是「没写 `preview_urls` 时跟 `workers_dev` 走」；`workers_dev` 关掉后如果不写 `preview_urls: true`，预览地址会一起关掉。预览适配器原样读这两个值，所以分支预览配置里的 `workersDev` 也是 false，`previewUrls` 仍是 true。

### 自动部署（Cloudflare Workers Builds）

生产和分支预览都由 Workers Builds 的 GitHub 连接触发。GitHub Actions 不发布。

| 设置 | 生产分支 `main` | 非生产分支 |
| --- | --- | --- |
| 构建命令 | 留空 | 留空 |
| 部署命令 | `pnpm exec void deploy --platform cloudflare` | `pnpm preview:deploy` |
| 根目录 | `/` | `/` |
| 构建环境变量 | `NODE_VERSION=24.21.0`、`CF_ACCESS_CLIENT_ID`、`CF_ACCESS_CLIENT_SECRET` | `NODE_VERSION=24.21.0` |

- 构建命令留空：`void deploy` 自己跑 `inference.build`，`pnpm preview:deploy` 自己先 `pnpm build`，填了会构建两次。
- 凭据：Workers Builds 在构建环境注入 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`。Void 1.1.12 的 `ensureCloudflareAuthentication` 看到 `CLOUDFLARE_API_TOKEN` 就直接用，不跑 whoami/login；`WORKERS_CI` 在它内置的 ci-info 里被识别成 CI，走非交互路径。account 优先读 `void.lock.json` / 配置里的 `account_id`，再读 `CLOUDFLARE_ACCOUNT_ID`。
- Access 探活：Void 的 `/__void/ready` 探活读 `CF_ACCESS_CLIENT_ID` + `CF_ACCESS_CLIENT_SECRET`，发 `CF-Access-Client-Id` / `CF-Access-Client-Secret` 头，优先于 `CF_ACCESS_TOKEN`（本地用 `cloudflared access token`）。service token 要被探活目标（Worker Version 的预览 URL）前面的 Access 应用放行，policy action 用 Service Auth。Void 没有跳过探活的开关。这两个值放构建环境变量（Build variables），不要放 Worker 运行时变量。
- Worker 运行时 secret（`GITHUB_TOKEN`、`ACCESS_TEAM_DOMAIN`、`ACCESS_AUD`）已经用 `void secret put` 写过；`cf previews deploy` 的预览也需要这三个值。
- `void.lock.json` 已提交：里面是第一次真实 `void deploy` 写出的 account id 和 `CACHE` 的 KV namespace id。Workers Builds 是干净 checkout，要靠它复用同一个 namespace。
- 和 lig 的区别：lig 的生产部署命令是 `pnpm exec cf deploy`；这里生产保持 Void。

GitHub Actions 的 `check.yml` 只跑 check 和 test。

### 非静态 appType，查到的做法

依据（2026-10-19 读到的文档，不是这次仓库里跑通过的部署）：

- [Supported App Types](https://void.cloud/guide/app-types)：`inference.appType` 可以是 `"void"`、`"framework"`、`"spa"`、`"static"`。Nuxt 属于 meta-framework，对应 `"framework"`。`"static"` 只上传静态文件，没有 Worker。
- [Nuxt integration](https://void.cloud/integrations/frameworks/nuxt)：Nitro `preset: 'cloudflare-module'`，开发时 `nitro.cloudflare.dev.configPath` 指向 `./.void-wrangler.jsonc`。`vite` 里加 `voidPlugin()`。绑定从 `event.context.cloudflare.env` 读。
- [Config](https://void.cloud/reference/config)：`inference.bindings.kv` 接受 `true`（默认名 `KV`）或字符串自定义名。这里写成 `'CACHE'`。`kv_namespaces` 这类带 id 的数组放在 `cloudflare` 里；id 要等 Void 第一次部署写进 `void.lock.json`。没有真实部署，所以这里不编一个 namespace id。
- [Environment variables](https://void.cloud/guide/env-vars)：secret 在根目录 `env.ts` 用 `defineEnv` 声明。没有 `VITE_` 前缀的键是服务端值。生产用 `void secret put GITHUB_TOKEN`、`void secret put ACCESS_TEAM_DOMAIN`、`void secret put ACCESS_AUD`，不要写进 `void.config.ts` 的 `vars`。本地值放 `.env`，`.env` 不进 git，也不会被 deploy 上传。
- [cf programmatic config](https://developers.cloudflare.com/cf/projects/cloudflare-config/)：会跑代码的 Worker 需要 `entrypoint`。KV 用 `bindings.kv()`，secret 用 `bindings.secret()`，都挂在 `worker.env` 下。预览适配器因此声明了 `CACHE` 和 `GITHUB_TOKEN`，入口指向 Nitro `cloudflare-module` 的 `.output/server/index.mjs`。`assets.notFoundHandling: 'none'`、`runWorkerFirst: true`，让 server route 由 Worker 处理。

本地 `nuxt build`（Nitro preset `cloudflare-module`）已经跑通，产物是 `.output/server/index.mjs`，旁边有 `.output/public`。入口文件会 import `node:*` 和 `cloudflare:workers`，所以运行时需要 `nodejs_compat`。这次构建没有写出 `.output/server/wrangler.json`：Nitro 只在 provider 被识别成 `cloudflare_workers` 时才默认打开 `deployConfig`。

Nitro 不会读 `void.config.ts` 或 `wrangler.config.ts` 来判断要不要开 Node 兼容。它只扫 `wrangler.json`、`wrangler.jsonc`、`wrangler.toml`。第一次构建因此警告 `Node.js compatibility is not enabled`。`nuxt.config.ts` 里显式写了 `nitro.cloudflare.nodeCompat: true`，第二次构建不再警告，并把 `nodejs_compat` 编进 Worker。Void 配置里的 `compatibility_flags` 仍然要留着，那是部署时交给 Cloudflare 的旗标，不是 Nitro 的构建开关。

页面引用共享逻辑要用 `#shared/turn`。写成相对路径时，编出来的页面 chunk 会在 `.nuxt` 缓存目录里找不到 `shared/turn.ts`，Nitro 直接构建失败。

没有在这个环境里执行 `void deploy` 或 `cf previews deploy`（没有 Cloudflare 凭据）。Void 是否会按 `framework` 吃下这份 Nitro 产物、以及 `bindings.kv()` 不带 id 时预览会不会自己建 namespace，都还没被一次真实发布证实。

现在提交的 `void.lock.json` 来自真实部署，KV id 是 Cloudflare 分配的。不要提交本地构建写出的 `local` 占位 id。

`wrangler.config.ts` 的 `assetsDirectory: './.output/public'` 沿 lig 的预览适配留下；cf 文档说有 `cloudflare.config.ts` 时构建不一定读这份 Wrangler 配置。Nitro 构建日志会建议 `npx wrangler`，这个仓库不跑那条命令。

本地 KV：Nitro 的 `cloudflare.wrangler.kv_namespaces` 写了 binding `CACHE` 和占位 id `local-osdash-cache`，只给 dev 的本地模拟用。没有 binding 时，`server/cache.ts` 退回进程内 Map，TTL 仍是 10 分钟。

## 数据

- `server/github.ts` 用 GitHub GraphQL。查询是 `author:0froq -user:0froq`，PR 和 issue 分开搜：开着的，或 `closed:>=` 14 天前。每种最多 5 页、每页 20 条。
- 判断在 `shared/turn.ts` 的 `judge`。创建本身算作者的一条真人动静。bot：`__typename == Bot`，login 以 `[bot]` 结尾，或 login 在 `coderabbitai`、`codecov`、`netlify`、`vercel`、`coldtea-pr-lens`、`chatgpt-codex-connector`。丢掉 bot 评论，但失败的 CLA 检查和 CodeRabbit 可执行评论算「轮到我」。
- 每条 issue / PR 再拉 REST timeline（`/repos/{owner}/{repo}/issues/{number}/timeline`）和 PR head 的 check runs。`action_required` 且名字不是 CLA，是首次贡献者 workflow 等维护者批准。timeline 按 `updatedAt` 做 KV 键，check run 按 head sha，刷新 `?refresh=1` 不读 KV。
- issue 和 PR 只按 timeline 的 `cross-referenced` / `connected`（以及 GraphQL 的 cross-reference）并成一条。不从正文猜 `Fixes #`。
- 贡献类型和回合是两套字段。类型可多选：claim、proposal、help、non-code。回合是 `mine` / `maintainer` / `other` / `none`。计时是距最近一条相关动静的天数。「said I'd do it but haven't」是 mine 且认领了但还没有自己的 PR；「stalled >14d」是回合不是 none 且超过 14 天。刚好 14 天不算。
- 回合先走规则：已合并或已关闭是 none；真实 CI 失败、CLA 失败、最新已提交 review 是 `CHANGES_REQUESTED` 且之后 0froq 没有 push、维护者最后一条评论 @ 了 0froq、或维护者要 PR / rebase，都是 mine。维护者看 `author_association` 的 OWNER / MEMBER / COLLABORATOR。0froq 的问句、0froq 的 issue 还没人回、干净 PR 等评审，是 maintainer。最后一条真人评论来自其他人，是 other。`PENDING` 的 review 不算「最新一条已提交的 review」。
- 只有规则定不下来才叫 clef：0froq 最后一条真人评论是陈述，或一段收尾不清楚的长帮助评论。输入最近 3 条真人评论、关联 PR 状态、距今天数。输出恰好一个回合，外加它依据的那句话。置信度低于 0.7，或依据的是 `Thanks!` 这类客套收尾，退回规则默认。缓存键 `turn-clf:v1:{commentId}:{updatedAt}`。认领分类仍用 `claim-clf:v1:{commentId}:{updatedAt}`。
- Vercel / Netlify 的预览、部署、授权类失败不算真实 CI 失败。lint 失败算。
- CI 还在排队、进行中、等待，或 conclusion 是 `ACTION_REQUIRED` 时加「CI awaiting approval」。
- 等待从最后一条相关动静算。只有 maintainer 上色：超过 7 天黄，超过 14 天红。刚好 7 天、刚好 14 天不上更深的颜色。mine 的回合芯片始终是红的。
- 平均首次回复：别人（不是 0froq、不是 bot）第一条非创建动静减去创建时间。没有回复的不进平均。
- `?refresh=1` 跳过 KV。开发时页面带 `mock=1`，生产构建里 `import.meta.dev` 为假，样例不会打开。
- Notion 只在 `server/notion.ts`。`createNotionSource().connected` 是 `false`，不发请求。

## Cloudflare Access

生产构建（`import.meta.dev === false`）里，`server/middleware/access.ts` 要求每个请求带 `Cf-Access-Jwt-Assertion`。`nuxt dev` 跳过，不校验。缺头、缺 `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD`、`ACCESS_AUD` 拆完是空列表、签名或声明校验失败，都只回 403，不把失败原因写进响应。

校验用 `jose` 的 `jwtVerify`，算法只接受 `RS256`。`ACCESS_TEAM_DOMAIN` 可以是 team 名（`froq`）或团队域名（`https://froq.cloudflareaccess.com`）。JWKS 固定是 `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`，`iss` 必须是 `https://<team>.cloudflareaccess.com`。`ACCESS_AUD` 可以是一个 aud，也可以是逗号分隔的多个。`server/middleware/access.ts` 和 `server/access.ts` 按逗号拆开、去掉两端空白、丢掉空段，把这个数组交给 `jwtVerify` 的 `audience`。token 的 `aud` 命中其中任意一个即可。空列表仍是 403。依据是 Cloudflare 的 [Validate JWTs](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)：Workers 示例用 `createRemoteJWKSet` 和 `jwtVerify({ issuer, audience })`。

Access 应用这样配：

1. Cloudflare Zero Trust → Access controls → Applications，新建 Self-hosted application，目标域名 `osdash.froq.me`。
2. 加上允许的身份源和 policy。
3. 在应用的 Additional settings 里复制 Application Audience (AUD) Tag，这就是 `ACCESS_AUD` 里的一项。删掉重建应用之前它不变。生产和分支预览各有一个 aud 时，用逗号写在同一个 `ACCESS_AUD` 里。
4. `ACCESS_TEAM_DOMAIN` 用团队域名 `https://<team>.cloudflareaccess.com`。
5. 用 `void secret put` 写入这两个值。预览适配器里也声明了同名 secret，分支预览若要过这层 middleware，部署环境里同样要有这两个值。

预览地址另外用 Worker 设置里的 Access 开关保护，不要靠把 `osdash.froq.me` 配到预览上。文档路径（[Preview URLs](https://developers.cloudflare.com/workers/configuration/previews/)、[Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)，2026-10-19 读到）：Workers & Pages → 选中 `osdash` → Settings → Domains & Routes，在 Preview URLs 上点 Enable Cloudflare Access。只保护这一个 Worker 的预览时，也可以走该 Worker 的 Access 页，选 Previews only。开关打开后，Access 会挡在预览 URL 前面。这次没有登录 dashboard 点过这个开关。

这层 middleware 在所有非 dev 构建里都会跑，包括分支预览。预览 Access 应用会发另一个 `aud`。把那个 aud 和生产的 aud 用逗号写进同一个 `ACCESS_AUD`，token 命中其中任意一个就过这层校验。预览文档还写了：打开 Access 之后，要在 Worker 里用它给出的 `aud` 和 JWKS 再验一次 token。
