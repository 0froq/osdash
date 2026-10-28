# osdash

- 默认中文回复。
- 这是只读看板。不要加写 GitHub、合并、发评论的功能。
- 不对 UI 写测试。验收用 `vp run check`、`vp run test`，以及手动看页面。

## 样式

- 组件样式写在组件自己的 `<style scoped>` 里。不用 UnoCSS，不加 utility class，不用 CSS Modules。
- `app/assets/css/` 只留全局：`tokens.css`（`:root` 变量、reset、reduced-motion 兜底）和 `ui.css`（把 `--ui-*` 桥到 osdash 皮肤）。别的新 CSS 文件都不加。
- 目标元素在组件 scope 之外时才写非 scoped `<style>`，并在注释里写清为什么。当前只有两处：`Timeline.vue` 的 fold hover（按钮在本组件、点在 `TimelineGutter` 里），以及 `@froq/ui` 组件的皮肤桥接。
- 要穿透子组件用 `:deep()`。`:deep()` 只给最后一段选择器加 scope，祖先选择器照常生效。
- 共享样式优先抽组件（`UnreadDot`、`EmptyState`），不要抽公共 CSS 文件。十几行的重复规则留在各自组件里，副本比跨文件跳转好读。
- 浮动菜单用 `@froq/ui` 的 `Menu`，不要自己写 popover 壳。它的面板被 portal 到最近的 `.ui`，在组件 scope 之外，所以菜单皮肤写在 `app/assets/css/ui.css` 的 `.osdash-menu` 下，不在组件的 scoped style 里。方言照 lig 头栏菜单：发丝边框、无阴影、`border-radius: 0`、行高亮用下划线而非填色、当前项用 accent 点。
- 库的 `Menu` 不把 DismissableLayer 的 dismiss 事件转成关闭，Escape 需要在调用方自己监听。

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

运行时不再声明 KV。可再生的 GitHub 响应走 Cache API，本地没有 `caches.default` 时退回 `server/cache.ts` 的进程内 Map。登录态在加密 cookie 里，BYOK 只在浏览器。

## 数据

- `server/github.ts` 用 GitHub GraphQL。查询是 `author:{viewer} -user:{viewer}`，PR 和 issue 分开搜：开着的，或 `closed:>=` 14 天前。每种最多 5 页、每页 20 条。
- 一张卡是一个 contribution（`shared/units.ts`）。viewer 自己的 PR 是实线卡，关联 issue 只作上下文。viewer 只在 issue 上出过力、还没有自己的 PR 时，是虚线卡。别人的 PR 不成卡，只用来填 `fixedBy`。viewer 的 PR 卡也有 `fixedBy`：它 closing 的 issue 上，别人已合并的那张 PR。还开着的竞争 PR 不算。`fixedBy` 不进 `members`，不影响回合，只让时间线接口多拉这张 PR 的 REST timeline（不拉 check run 和行内评论）。同一 issue 上已关闭未合并、且关闭时间不晚于下一张 PR 创建后 24 小时的旧 PR，并进新卡的 `history`。
- `myTurn` 是未结束且 `judge` 的回合为 `mine`。未读跟 GitHub 参与通知走。标已读会 PATCH 对应线程。没有星标和稍后。首页分区：轮到我、等别人、已结束（关闭在 14 天内）。收件箱、时间线和通知列表缓存在 Worker Cache API。登录态在加密 cookie 里。BYOK 只在浏览器。不使用 KV。
- 判断在 `shared/turn.ts` 的 `judge`。创建本身算作者的一条真人动静。bot：`__typename == Bot`，login 以 `[bot]` 结尾，或 login 在 `coderabbitai`、`codecov`、`netlify`、`vercel`、`coldtea-pr-lens`、`chatgpt-codex-connector`。丢掉 bot 评论，但失败的 CLA 检查和 CodeRabbit 可执行评论算「轮到我」。
- 每条 issue / PR 再拉 REST timeline（`/repos/{owner}/{repo}/issues/{number}/timeline`）和 PR head 的 check runs。`action_required` 且名字不是 CLA，是首次贡献者 workflow 等维护者批准。timeline 按 `updatedAt` 做缓存键，check run 按 head sha，刷新 `?refresh=1` 不读缓存。标准化事件缓存在 `events:v3:{login}:…`，行内评论缓存在 `revcomments:v2:{login}:…`，都带 viewer login，避免私有仓库时间线跨用户读到。这些键走 Cache API。预览走 `GET /api/timeline`。
- issue 和 PR 只按 timeline 的 `cross-referenced` / `connected`（以及 GraphQL 的 cross-reference / `closingIssuesReferences`）并成一张卡。不从正文猜 `Fixes #`。
- 贡献类型和回合是两套字段。类型可多选：claim、proposal、help、non-code。回合是 `mine` / `maintainer` / `other` / `none`，只在规则内部使用。计时是距最近一条相关动静的天数。「said I'd do it but haven't」是 mine 且认领了但还没有自己的 PR；「stalled >14d」是回合不是 none 且超过 14 天。刚好 14 天不算。
- 回合先走规则：已合并或已关闭是 none；真实 CI 失败、CLA 失败、最新已提交 review 是 `CHANGES_REQUESTED` 且之后 viewer 没有 push、维护者最后一条评论 @ 了 viewer、或维护者要 PR / rebase，都是 mine。维护者看 `author_association` 的 OWNER / MEMBER / COLLABORATOR。viewer 的问句、viewer 的 issue 还没人回、干净 PR 等评审，是 maintainer。最后一条真人评论来自其他人，是 other。`PENDING` 的 review 不算「最新一条已提交的 review」。
- 只有规则定不下来才叫 clef：viewer 最后一条真人评论是陈述，或一段收尾不清楚的长帮助评论。输入最近 3 条真人评论、关联 PR 状态、距今天数。输出恰好一个回合，外加它依据的那句话。置信度低于 0.7，或依据的是 `Thanks!` 这类客套收尾，退回规则默认。缓存键 `turn-clf:v1:{commentId}:{updatedAt}`。认领分类仍用 `claim-clf:v1:{commentId}:{updatedAt}`。Workers AI 只给 `OSDASH_CLEF_LOGINS` 里的登录名。
- Vercel / Netlify 的预览、部署、授权类失败不算真实 CI 失败。lint 失败算。
- CI 还在排队、进行中、等待，或 conclusion 是 `ACTION_REQUIRED` 时加「CI awaiting approval」。
- 等待从最后一条相关动静算。只有 maintainer 上色：超过 7 天黄，超过 14 天红。刚好 7 天、刚好 14 天不上更深的颜色。界面用 `myTurn` 和未读分区，不再显示回合芯片。
- 平均首次回复：别人（不是 viewer、不是 bot）第一条非创建动静减去创建时间。没有回复的不进平均。
- `?refresh=1` 跳过缓存。后台过期刷新仍读缓存，只重拉有变化的条目。开发时页面带 `mock=1`，生产构建里 `import.meta.dev` 为假，样例不会打开。
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

<!-- froq-ui -->
## @froq/ui

本项目的 UI 库源码在 `vendor/ui`。这是本仓库里的普通目录，不是 submodule，目录里没有自己的 git。所有 git 命令都在本项目根目录执行，不要进入 `vendor/ui`。依赖用 file 协议指向 `vendor/ui`，包名是 `@froq/ui`。

在本项目里改 UI，就是改 `vendor/ui/src/...`。保存后本项目的 dev server 会更新。然后在本项目根目录提交并推送。本地 dev 和远端构建编译的是这次提交里的文件。这次提交不会自动进入 https://github.com/0froq/ui ，别的项目也不会变。

库的形状是：`vendor/ui/src/core/` 放不依赖框架的逻辑，`vendor/ui/src/vue/` 放无样式的 Vue 行为，组件在 `vendor/ui/src/components/`。组件只读这些变量：`--ui-bg` `--ui-fg` `--ui-muted` `--ui-faint` `--ui-line` `--ui-accent` `--ui-font-display` `--ui-font-text` `--ui-font-meta` `--ui-ease` `--ui-dur` `--ui-radius`。作用域类是 `ui`，由使用方加在外层。

### 推送到上游

用户说本项目里的 UI 有改动要推到上游、推到 ui 仓库，或同样意思的话时，按顺序做：

1. 在本项目根目录执行 `git status`。
2. `vendor/ui` 有未提交的改动时，先在本项目里提交这些改动。提交里只放 `vendor/ui`，以及这次改动必须配套的锁文件。不要把本项目其他目录的无关改动放进同一次提交。提交说明写 UI 改了什么。
3. 把本项目推到它自己的远程，使本项目远端和这次提交一致。
4. 在本项目根目录把 `vendor/ui` 送回 UI 仓库：

```bash
git subtree push --prefix=vendor/ui https://github.com/0froq/ui.git main
```

5. 成功之后，https://github.com/0froq/ui 的 `main` 包含这些改动。不打 tag，不修改别的项目。
6. 推送被拒绝时不要 force push。先完成本节「拉取上游」，解决冲突并提交，再执行一次上面的 `subtree push`。
7. 没有 `0froq/ui` 的写权限，或命令失败时，停下并说明原因。

### 拉取上游

用户说要拉取 UI 上游的最新变化、跟上 ui 仓库，或同样意思的话时，按顺序做：

1. 在本项目根目录执行 `git status`。`vendor/ui` 以外有未提交改动时停下来，告诉用户。只有 `vendor/ui` 有未提交改动时，先按「推送到上游」的第 2 步提交，然后再拉取。
2. 在本项目根目录执行：

```bash
git subtree pull --prefix=vendor/ui https://github.com/0froq/ui.git main --squash
```

3. 出现冲突时，只在 `vendor/ui` 里解决，然后 `git add vendor/ui`，完成这次合并提交。不要把仓库留在合并进行中的状态。
4. 命令成功时，这次拉取已经是本项目里的一次提交。把该提交推到本项目自己的远程。
5. `vendor/ui/package.json` 的依赖有变化时，在本项目根目录按本项目的包管理器重新安装。
6. 拉取只更新本项目的 `vendor/ui`。别的项目仍用它们自己的那一份。

### 把项目里的组件抽进库

用户指出本项目里、`vendor/ui` 以外的组件，要求抽进 UI 库、移植进 `vendor/ui`，或同样意思的话时，按这个做。`vendor/ui` 还不存在时，先安装库再抽。不要在抽组件的同时执行 `subtree push`，除非用户同时要求推到上游。

先读这个组件、它的样式、它用到的 composable，以及本项目里所有引用它的地方。分成三类：

- 交互：选择、开关、键盘、动效是否播放。
- 外观：跟库里现有组件一样，只读那十二个 `--ui-*`。对不上时先问，不要自己加另一套样式。
- 项目专属：文案、路由、i18n、某一页的数据、业务 store、只服务这一页的布局。这些留在本项目里。

不要抽这些：页面、路由、markdown 内容、整页布局。组件的核心状态如果是路由参数、业务数据或项目 store，只把交互外壳抽进库，数据留在调用处。

库里面分这几层。抽出去的东西要落在其中一层，而不是在项目里长什么样就原样搬进去：

- token：`vendor/ui/src/tokens.css`。只有颜色、字体、缓动、圆角能写进那十二个 `--ui-*` 时，才停在这一层。
- `core`：`vendor/ui/src/core/`。不引用 Vue 的逻辑。
- `vue`：`vendor/ui/src/vue/`。Vue 行为，没有样式。
- 组件：`vendor/ui/src/components/<concept>/<Name>.vue`（或 `.ts`）。同一目录是同一个概念。从 `vendor/ui/src/index.ts` 导出。

下面三件事只要有一件不能确定，就先问用户，不要动手改库。问的时候列出你看到的做法和各自的后果，然后停下等答复：

1. 它和库外的页面组件耦合在一起时：是解开耦合、只抽这一份，还是把耦在一起的几份都抽进去，还是合成一个组件。
2. 放在哪一层、抽到多细：只抽 token，抽 `core` 或 `vue` 的行为，还是抽整个组件。
3. 外观能不能只用现有的 `--ui-*`。能，就放进 `src/components`。对不上时先问，不要自己加另一套样式。

用户定了之后再改代码，让它在库里和项目里都能运行。不要把项目文件原样复制进 `vendor/ui`。指向页面组件、项目 store、路由、项目类名和项目色值的地方，改成 props、slot，或库里已有的函数；样式改读 `--ui-*`。调用处仍由项目传入文案和数据。改完后，原来的页面还要能渲染。外观如果用了 token 契约里没有的颜色或字体，而且不能改写成那十二个变量，停下来告诉用户缺哪一个，不要给这个组件单开一套变量。

写库里的代码之前，读 `vendor/ui/AGENTS.md` 的「代码规范」，并对照同一层已有文件。规范一节还没有细则时，以同一目录里已有组件为准，并让库的 eslint 通过。不要另起一套写法。

1. 定名字和 props。库里已有同一种控件就沿用现有名字，例如 `Choice`、`Toggle`。新控件不要带项目名。props 只保留交互需要的，例如 `v-model`、`options`、`label`。项目专属参数留在本项目里包一层。
2. 行为。不依赖 DOM 结构的逻辑放进 `vendor/ui/src/core/`，不要引用 Vue。需要 Vue、但不关心样子的逻辑放进 `vendor/ui/src/vue/`，并从 `vendor/ui/src/vue/index.ts` 导出。已有 `useChoice` 或其他函数能用就用，不要复制一份。有动效时用 `vendor/ui/src/core` 里的 `prefersReducedMotion`。
3. 皮肤。在 `vendor/ui/src/components/<concept>/<Name>.vue` 写模板和样式，只读那十二个 `--ui-*` 变量。不要写本项目的类名、色值或字号。组件根上不要写 `ui`，由使用方加在外层。样式加进 `vendor/ui/src/style.css`。已有概念就放进那个目录，对不上时先问，不要自己新开一个概念。
4. 从 `vendor/ui/src/index.ts` 导出该组件。共享类型从 `vendor/ui/src/vue/index.ts` 导出。
5. 在组件旁边加 `vendor/ui/src/components/<concept>/<Name>.demo.vue`，以及 `<Name>.md`（英文说明）和 `<Name>.zh.md`（中文说明）。文档站生成概念页 `/components/<concept>` 和组件页 `/components/<concept>/<name>`。概念页放这个目录里每个组件的 demo，组件页渲染旁边的说明。左侧目录有三层：form、prose 这种分组名不是页面；概念和组件都是页面。不要另写一份 demo 名单。
6. 换本项目的引用。调用处改为从 `@froq/ui` 导入，并引入 `style.css`（项目里还没有这份样式时才加）。文案和数据留在调用处。本项目里不再有旧文件的引用之后，删掉旧的组件文件。只负责使用它的页面代码留着。
7. 在本项目根目录提交。同一次提交同时包含 `vendor/ui` 的新组件和本项目换引用的改动。提交说明写抽了哪个组件。然后把本项目推到它自己的远程。不要执行 `subtree push`。

做完之后，在回复里说明下面这些，让用户审查。不要接着做别的改动：

1. 放在哪一层、哪个目录。
2. 这是 Vue 组件时，写明 props、`v-model`、插槽，并给一段在本项目里的用法。只抽了 token 或行为、没有组件时，写明新增或改动了哪些变量或函数，以及项目里怎么引用。
3. 为了解开耦合改了哪些调用，哪些东西留在本项目里。

抽完核对：

- 库组件的样式里没有本项目的类名和色值。
- 本项目通过 `@froq/ui` 使用它，不再引用旧文件。
- 改动在本项目的 git 历史里，还没有进入 https://github.com/0froq/ui ，除非用户另外要求推到上游。
<!-- /froq-ui -->
