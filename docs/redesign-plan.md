# osdash 重设计计划：从看板到「收件箱」

基线：`main` @ `515b983`（PR #10 已 squash 合并，多用户 GitHub OAuth 已上线）。本文只是计划，不含实现。文中引用的文件和行号都是 `main` 上的。

批准的方向：主人给的 `inbox.html` demo，参考图是一张 Superhuman 式邮件首页截图。样式取 lig.froq.me 的纸感，交互借 feeds.froq.me。

---

## 0. 结论先行

1. 展示单位从「GitHub item（issue 或 PR）」换成 **contribution**：一个 viewer 写的 PR 是一张实线卡，关联 issue 只是它的上下文字段。viewer 只在 issue 上出过力、还没有自己的 PR 时，是一张**虚线卡**。
2. 现有的回合判定（`shared/turn.ts` 的 `judge`、`shared/claim.ts`、`shared/turn-rules.ts`、clef 分类器）**原样保留**，在它上面加一层：`myTurn = verdict.turn === 'mine'`。对外不再暴露 `Turn` 枚举。
3. 不是 myTurn 的卡，只按「上次看过之后有没有新动静」分成 **有动静** 和 **等别人**。已读状态按用户存在 KV 里，不进看板缓存。
4. 新增预览面板：`GET /api/timeline` 把 PR 和所有关联 issue 的事件按时间合并成一条时间线，复用看板 enrichment 已经在拉的 REST timeline。
5. 界面换成 demo 的布局：左侧栏、问候句、四个分区、右侧预览；手机上侧栏变顶部 chip 行，预览变全屏 sheet。
6. 文案改中文（demo 是中文），并把所有写死 `0froq` / `froQ` 的地方改成按登录用户。

---

## 1. 现状盘点（main 上的文件）

| 文件 | 现在做什么 | 这次怎么处理 |
| --- | --- | --- |
| `app/pages/index.vue`（583 行） | 四列看板、设置弹窗、主题切换、j/k/h/l 键盘 | **重写**为 inbox 页面，逻辑拆进组件和 composable |
| `app/pages/login.vue` | 登录页，英文 | 改文案、改样式 |
| `app/app.vue` | `<Paper><NuxtPage/></Paper>` | 保留 |
| `app/components/Paper.vue`、`app/utils/paper.ts` | 纸纹 canvas | 保留 |
| `app/theme.ts` | 首屏前选主题 | 保留 |
| `app/assets/css/board.css`（519 行） | token + 看板样式 | 拆成 `tokens.css`（保留 token 段）+ `inbox.css`；删掉 `.columns/.column/.row/.chip.turn` 等看板样式 |
| `server/api/board.get.ts` | 读缓存/重建看板，mock | 换成 `server/api/inbox.get.ts`；`board.get.ts` 删除 |
| `server/board-response.ts` | 组装 `BoardPayload`、KV 缓存 `board:v3:{login}` | 改成 `inbox-response.ts`，缓存键升到 `inbox:v1:{login}` |
| `server/github.ts` | GraphQL 搜索、`mapNode`、`loadBoard` | 加 `closingIssuesReferences`；`loadBoard` 返回 contribution 而不是 `BoardItem` |
| `server/github-rest.ts` | REST timeline（只抽 link）和 check runs | timeline 改成同时抽取并缓存**标准化事件** |
| `shared/timeline.ts` | `linksFromTimeline`、`expandMissingLinkedPulls`、`mergeLinkedItems` | 合并逻辑被新的 `shared/units.ts` 取代；`combine` 保留给单位内部用 |
| `shared/turn.ts` | `judge`、`present`、`summarize`、格式化 | `judge` 不动；`present` / `BoardItem` / `turnLabel` 退场；新增 `reasonCode` |
| `shared/identity.ts` | `SELF = '0froq'`、`isSelf` 默认参数 | 删 `SELF` 和默认参数 |
| `server/mock.ts` | 22 个样例，全是 `0froq` | 改成 `MOCK_VIEWER`，补虚线卡、合并历史、分拆 PR 的样例 |
| `server/byok.ts` | Workers AI clef 只给 `0froq` | 改读 `OSDASH_CLEF_LOGINS` |

---

## 2. 数据模型（server + shared）

### 2.1 新类型：`shared/unit.ts`

```ts
export type UnitKind = 'pr' | 'issue-only'

/** 侧栏的贡献类型，一张卡恰好一个。 */
export type UnitCategory = 'claimed-fix' | 'direct-pr' | 'reported' | 'helped'

export type UnitIssue = {
  repo: string
  number: number
  url: string
  title: string
  state: ItemState
  authorLogin: string
  /** closing = PR 的 closingIssuesReferences 或 connected 事件；mention = 仅 cross-referenced */
  link: 'closing' | 'mention'
  /** 这个 issue 还被 viewer 的哪些其他 PR 引用（分拆 PR 时填） */
  sharedWith: Array<{ repo: string; number: number; url: string }>
}

export type UnitHistoryPr = {
  repo: string
  number: number
  url: string
  title: string
  state: 'closed'
  closedAt: string
}

export type Unit = {
  id: string               // 'pr:owner/repo#123' 或 'issue:owner/repo#45'
  kind: UnitKind
  category: UnitCategory
  tags: ContributionType[] // 复用 contributionTypes：claim / proposal / help / non-code
  repo: string
  number: number           // PR 号；issue-only 时是 issue 号
  title: string
  url: string
  state: ItemState
  createdAt: string
  closedAt: string | null
  issues: UnitIssue[]      // 0..n
  history: UnitHistoryPr[] // 被这张卡取代的旧 PR，默认折叠
  fixedBy: { repo: string; number: number; url: string; authorLogin: string; state: ItemState } | null

  myTurn: boolean
  ended: boolean           // state !== 'open'
  reason: string           // 英文原句，测试和 clef 用
  reasonCode: ReasonCode   // UI 用它出中文
  reasonActor: string | null
  quote: string | null     // clef 依据句
  labels: BoardLabel[]
  marks: DerivedMark[]
  tone: Tone
  lastActivityAt: string   // 最近一条相关动静（同 verdict.waitingSince）
  lastOtherActivityAt: string | null // 最近一条「不是 viewer、不是被丢弃的 bot」的动静，用于未读
  ageMs: number
  firstReplyMs: number | null
  links: { item: string; comment: string | null; ci: string | null }
  /** 预览接口用：本卡包含的 GitHub item。 */
  members: Array<{ repo: string; number: number; kind: ItemKind; updatedAt?: string; headSha?: string }>
}

/** 每次 GET 时和用户状态合并，不进看板缓存。 */
export type UnitView = Unit & {
  unread: boolean
  starred: boolean
  laterUntil: string | null
}
```

`ReasonCode` 放在 `shared/reason.ts`，是一个字面量联合：`'claimed-open-pr' | 'claim-pending' | 'ci-failed' | 'ci-lint-failed' | 'cla-failed' | 'changes-requested' | 'coderabbit' | 'mentioned' | 'asked-pr-or-rebase' | 'asked-waiting' | 'already-fixed' | 'workaround' | 'opened-waiting' | 'replied-waiting' | 'pushed-waiting' | 'commented' | 'approved' | 'review-dismissed' | 'pushed' | 'merged' | 'closed' | 'clef'`。`app/utils/reason.ts` 用穷尽 `switch` 映射成中文（例：`changes-requested` → `{actor} 要求修改`，`claimed-open-pr` → `认领了还没开 PR`）。

### 2.2 `judge` 怎么改（最小改动）

- `shared/turn.ts` 的 `Verdict` 加 `reasonCode: ReasonCode` 和 `reasonActor: string | null`。`coreVerdict` 里每个 `return` 同时给出 code；`humanReason` / `reviewReason` 各自返回 `{ text, code, actor }`。`reason` 文本保持不变，所以 `shared/turn.test.ts` 的 544 行断言不用改。
- `withResolvedTurn`（clef 结果）把 `reasonCode` 设成 `'clef'`，`quote` 照旧。
- `Turn` 枚举、`waitingTone`、`derivedMarks` 都留着，它们是规则内部的语言。`myTurn` 只在 `shared/unit.ts` 里由 `turn === 'mine'` 推出。
- `turnLabel` 删除（UI 不再显示回合芯片）。
- `tone` 的语义不变：只有原来 `maintainer` 回合才上黄/红。UI 在「等别人」卡上用它给天数上色。

### 2.3 组单位：`shared/units.ts`（替代 `mergeLinkedItems` 的对外角色）

输入：enrichment 之后、clef 之前的 `Item[]`（都带 `viewerLogin`）。输出：`UnitDraft[]`，每个 draft 是「主 PR + 关联 issue 的 Item 列表」。

1. **viewer PR 集合** `P`：`kind === 'pr' && isSelf(author, viewer)`。
2. **issue 集合** `I`：`kind === 'issue'`，并且 `includeIssueOnBoard(item)`（现有规则：viewer 开的、或认领没失效的），**另外**包含 viewer 写过帮助/诊断评论的 issue（`contributionTypes(item)` 含 `help`）。
3. **边**：PR → issue。来源有三种：
   - `closingIssuesReferences`（GraphQL，新加字段，见 2.5）→ `link: 'closing'`
   - `connected` 时间线事件 → `'closing'`
   - `cross-referenced` 事件 / issue 的 `linkedPullRequests` → `'mention'`
   正文里的 `Fixes #` 仍然**不**解析（AGENTS.md 规则不变；closing refs 是 GitHub 自己解析好的结构化数据，不是我们猜）。
4. **取代（supersede）**：同一个 issue 上有两个 viewer PR A、B，若 A 是 `closed` 且未合并，并且 `A.closedAt <= B.createdAt + 24h`，就把 A 并进 B 的卡，记入 `history`。链式取代（A→B→C）全部并进最新一张。
5. **分拆**：同一 issue 上多个 viewer PR，不满足取代条件（都开着、都合并了、或一个合并一个开着），各自成卡，每张卡的那个 `UnitIssue.sharedWith` 列出其他 PR。
6. **issue-only（虚线）**：`I` 里没有任何 viewer PR 边的 issue 自成一卡 `kind: 'issue-only'`。如果它有别人写的 PR（`linkedPullRequests` 里 `!isSelf(author)`），填 `fixedBy`（取最新的一个，合并优先）。
7. **别人的 PR 绝不并入单位**。现在 `expandMissingLinkedPulls` 会把 timeline 里任意 PR 做成 ghost 作者的 stub 并参与合并（`shared/timeline.ts:106-113`），新逻辑里这些 stub 只用来填 `fixedBy`。
8. **一个 issue 挂多张卡时**（分拆场景），它的评论会进每张卡的判定输入和未读计算。issue 上来一条新评论，两张卡都会变成「有动静」。这是预期行为，不做去重。

每个 draft 用现有 `combine`（从 `shared/timeline.ts` 导出）合成一个 `Item`，再走 `judge` → `maybeClassifyTurn` → `toUnit`。主 item 固定为 PR（issue-only 时是 issue），不再用 `primaryRank` 挑。

`category` 的推导（侧栏用，单选）：

| 条件（按顺序） | category | 侧栏文案 |
| --- | --- | --- |
| `kind === 'pr'` 且有 `closing` issue 且 viewer 在该 issue 上有认领/提问（`claimLevel` 非空或 tags 含 claim/proposal） | `claimed-fix` | 认领修复 |
| `kind === 'pr'` | `direct-pr` | 直接 PR |
| `kind === 'issue-only'` 且 viewer 是 issue 作者 | `reported` | 只提 issue |
| 其他 issue-only（认领、帮忙排查） | `helped` | 帮人排查 |

`tags` 原样展示为 chip（认领 / 提议 / 帮忙 / 非代码）。

### 2.4 myTurn / 分区

```
ended   = unit.state !== 'open'
myTurn  = !ended && verdict.turn === 'mine'
分区：
  轮到我  = myTurn && !later
  有动静  = !myTurn && !ended && unread && !later
  等别人  = !myTurn && !ended && !unread && !later
  已结束  = ended（只取 closedAt 在 14 天内的，沿用 RECENT_MS）
  稍后    = laterUntil > now（从首页四个分区移走，只在「稍后」视图里出现）
```

虚线卡走同样的分区。一张「认领了还没 PR」的虚线卡照旧是 myTurn（规则 `Claimed, open a PR`）。

### 2.5 GitHub 查询改动（`server/github.ts`）

- `PULL_REQUEST_FIELDS` 加 `closingIssuesReferences(first: 10) { nodes { number url state title repository { nameWithOwner } author { __typename login } } }`。映射到 `Item.closingIssues?: Array<{repo, number, url, state, title, authorLogin}>`（`shared/turn.ts` 的 `Item` 加这个可选字段）。
- 只在 closing ref 里出现、但搜索结果里没有的 issue：复用 #9 的思路，加 `hydrateMissingClosingIssues`，按 `repository.issue(number:)` 补拉，结果带 `viewerLogin`。不补拉也能出卡（用 closingIssues 里的标题/状态做 `UnitIssue`），补拉只为了让 issue 的评论参与判定和时间线。上限 20 个，超出不拉。
- 修掉 main 上残留的单用户默认：`shared/timeline.ts:99` 的 `isSelf(link.author)` 没传 viewer，会退回 `'0froq'`。改成 `isSelf(link.author, viewerLoginOf(item))`；`itemFromLinkedPull` / `itemFromTimelinePull` 产生的 stub 要带上 `viewerLogin`。

### 2.6 标准化时间线事件：`shared/events.ts`

```ts
export type EventKind =
  | 'opened' | 'comment' | 'review' | 'review-comment'
  | 'commit' | 'force-push' | 'ci'
  | 'labeled' | 'unlabeled' | 'assigned' | 'unassigned' | 'review-requested'
  | 'cross-ref' | 'connected' | 'renamed'
  | 'merged' | 'closed' | 'reopened'

export type UnitEvent = {
  id: string                 // GitHub node/event id，去重用
  kind: EventKind
  at: string
  actor: Actor
  source: { repo: string; number: number; kind: ItemKind } // 来自哪个 PR / issue
  url?: string               // 「原文 ↗」
  excerpt?: string           // 正文去 markdown、去引用块、折行后取前 140 字
  reviewState?: ReviewState
  ci?: { name: string; conclusion: CheckConclusion; status: CheckStatus }
  label?: { name: string; color: string }
  ref?: { repo: string; number: number; kind: ItemKind; url: string; title?: string }
  rename?: { from: string; to: string }
  commit?: { sha: string; message: string }
  bot: 'keep' | 'noise' | null // null = 人；keep = CLA 失败 / CodeRabbit 可执行；noise = 其他 bot
}
```

`normalizeRestTimeline(raw, source, viewer)`：把 REST timeline 的 `event` 字段映射到 `EventKind`（`commented`→comment，`reviewed`→review，`committed`→commit，`head_ref_force_pushed`→force-push，`labeled`/`unlabeled`，`assigned`/`unassigned`，`review_requested`，`cross-referenced`→cross-ref，`connected`，`renamed`，`merged`，`closed`，`reopened`），其余事件丢掉。用一个穷尽 `switch` 处理已知事件，未知字符串落到 `default` 返回 `null`（`event` 是 `string` 不是联合，所以这里不需要 `never` 检查；`EventKind` 的下游 switch 要有）。

`bot` 字段复用 `isBot` + `isFailingClaComment` + `isCoderabbitActionable`（先把 REST 评论转成 `Activity` 形状再调用）。

### 2.7 enrichment 顺手缓存事件（`server/github-rest.ts`）

`enrichItemsFromRest` 已经在为**每个** item 拉最多 3 页 REST timeline（`loadTimeline`），只是拿完 link 就丢了。改成：

- 拿到 `events` 后同时写两份缓存：现有的 `timeline:v2:{login}:{repo}#{n}:{updatedAt}`（link，键不变），和新的 `events:v1:{login}:{repo}#{n}:{updatedAt}` → `UnitEvent[]`（TTL 6h，同 `TIMELINE_TTL_SECONDS`）。
- 注意：现在当 GraphQL 已经给了 `timelineLinks` 时会跳过 REST（`github-rest.ts:107`）。为了预览，**不在看板加载时**强行拉；预览接口发现 `events:v1` 未命中时再拉。这样看板的请求量不变。

### 2.8 预览接口：`server/api/timeline.get.ts`

`GET /api/timeline?id=pr:owner/repo%23123[&refresh=1]`

1. 要求登录（401 同 inbox）。dev 下 `mock=1` 返回 `server/mock.ts` 里的样例时间线。
2. 从 `inbox:v1:{login}` 缓存里找这张卡；找不到返回 404。**只允许查自己看板里的卡**，避免变成通用 GitHub 代理。
3. 对 `unit.members` 每一项（PR、关联 issue、`history` 里的旧 PR）：
   - 读 `events:v1:…:{updatedAt}`；未命中或 `refresh=1` 时拉 REST timeline（复用 `loadTimeline`，3 页上限）并写回。
   - PR 额外拉 `GET /repos/{o}/{r}/pulls/{n}/comments?per_page=100`（行内 review 评论，REST timeline 不含）→ `review-comment`，缓存键 `revcomments:v1:{login}:{repo}#{n}:{updatedAt}`。
   - PR 的 head sha 拉 check runs（复用 `loadCheckRuns`，但要保留 `completed_at` / `started_at`）→ 每个完成的 run 一条 `ci` 事件，时间取 `completed_at`。缓存键 `ciev:v1:{login}:{repo}:{sha}`，TTL 10 分钟（同 `CHECKS_TTL_SECONDS`）。旧 commit 的 CI 不单独拉。
4. 合并：按 `at` 升序、`id` 去重（cross-ref 会在两边各出现一次，用 `ref` + `at` 去重）。
5. 折叠：连续的 `bot: 'noise'` 事件合成一个 `{ kind: 'bot-group', count, actors, from, to, events }`；同一分钟内同一 head sha 的多条 `ci` 合成一条 `ci-group`（「CI：5 过 · 1 败」）。`bot: 'keep'` 不折叠。
6. 响应：`{ id, generatedAt, cached, entries: Array<UnitEvent | BotGroup | CiGroup>, truncated }`。`truncated` = 任一 member 撞上 3 页上限或 REST 被 403/429 暂停（`StopFlag`）。
7. 整个响应也缓存一份 `tlresp:v1:{login}:{unitId}:{hash(members.updatedAt)}`，TTL 10 分钟，打开同一张卡第二次不再拼装。

### 2.9 未读 / 稍后 / 星标：按用户存 KV

这三项写的是 osdash 自己的 KV，不写 GitHub，符合「只读看板」的约束。

- 键：`seen:v1:{login}` → `{ baselineAt: string, at: Record<unitId, string> }`；`prefs:v1:{login}` → `{ starred: string[], later: Record<unitId, string /* until ISO */> }`。都不设 TTL（`seen` 里的条目在每次写入时裁掉 30 天前 `closedAt` 的卡和不在当前看板里超过 30 天的 id，防止无限增长）。
- **未读**：`unread = lastOtherActivityAt !== null && lastOtherActivityAt > (seen.at[id] ?? seen.baselineAt)`。
  - `lastOtherActivityAt` 在 `toUnit` 里算：卡内所有 activity 中，非 viewer、非 `isDroppedBot`（复用 turn-rules）的最新一条；CI 结果变化也算（PR head 的 check 结论里出现 FAILURE / 新的 SUCCESS 时取 board 加载时间，不精确但够用；预览打开后以时间线为准）。
  - `baselineAt`：用户第一次加载 inbox 时写入当前时间。这样新用户不会看到一屏「全部未读」。
- **标记已读**：`POST /api/seen` body `{ id, at }`，`at` = 前端拿到的 `unit.lastOtherActivityAt`。服务端只在 `at` 更新时写；同一用户 1 秒内多次写合并（KV 同键写入限 1 次/秒，前端也做 800ms 防抖批量：body 可以是 `{ items: [{id, at}] }`）。打开预览面板即视为已读；「有动静」卡上有「标为已读」小按钮（手机长按卡也行）。
- **稍后**：`PUT /api/prefs` `{ later: { id, until } }`，预设「明天早上 / 3 天后 / 下周一」；`until` 过期后自动回到原分区。**星标**：`{ star: { id, on } }`。
- 读路径：`GET /api/inbox` 先读 `inbox:v1:{login}`（或重建），再并行读 `seen:v1` 和 `prefs:v1`，合成 `UnitView[]`。看板缓存里没有任何用户状态，所以 stale-while-revalidate 逻辑（`board.get.ts:36-57`）可以原样搬过来。
- 本地 dev 没有 KV 时，`server/cache.ts` 的内存 Map 兜底，行为一致。

### 2.10 `GET /api/inbox` 响应

```ts
type InboxPayload = {
  generatedAt: string
  cached: boolean
  revalidating?: boolean
  truncated: boolean
  mock: boolean
  viewer: { login: string; name: string | null; avatarUrl: string | null }
  counts: { mine: number; activity: number; waiting: number; ended: number; later: number; starred: number;
            byCategory: Record<UnitCategory, number> }
  stats: BoardStats   // 沿用 summarize 的口径：merged / open / averageFirstReplyMs
  units: UnitView[]
}
```

`summarize` 改成吃 `Unit[]`（字段 `state` / `firstReplyMs` 同名，签名改成 `readonly { state: ItemState; firstReplyMs: number | null }[]` 即可）。

### 2.11 会话里补 name / avatar

`fetchGitHubLogin`（`server/auth/github-oauth.ts`）改成 `fetchGitHubUser` 返回 `{ login, name, avatarUrl }`；`SessionRecord` / `SessionUser` 加这两个可选字段；`/api/auth/me` 一起返回。老会话没有这两个字段时显示 login。

---

## 3. 前端组件树

```
app/
  app.vue                          保留
  pages/
    index.vue                      重写：只做数据加载、路由 query（?view=&cat=&open=）和布局拼装
    login.vue                      改文案和样式
  components/
    Paper.vue                      保留
    inbox/
      InboxShell.vue               两栏/三栏 grid：Sidebar | Main | PreviewPanel
      Sidebar.vue                  logo、首页/稍后/星标（带计数）、分隔线、四个 category、已结束、底部 viewer + 菜单
      SidebarMenu.vue              viewer 头像点开：刷新、主题（浅/深）、分类器设置、退出
      MobileNav.vue                手机顶部：logo + 横向 chip 行（同 Sidebar 的条目）+ 头像
      Greeting.vue                 问候句（见 4.2）
      FilterChips.vue              feeds 风格的 repo 筛选 chip，带计数，可横向滚动
      Section.vue                  mono 小标题「轮到我 3」+ slot；collapsible 属性给「已结束」
      UnitCard.vue                 一个组件三种尺寸：size="large" | "row" | "small"；dashed 由 unit.kind 决定
      CardMeta.vue                 mono 元信息行：repo#n · 相对时间 · 未读点
      EmptyState.vue               各分区/视图的空态
      PreviewPanel.vue             桌面右侧 panel / 手机全屏 sheet；头部 + Timeline
      PreviewHeader.vue            标题、state、关联 issue 列表（含 sharedWith、fixedBy）、history 折叠、「原文 ↗」、稍后/星标按钮
      Timeline.vue                 渲染 entries；按日期分组（mono 日期分隔）
      TimelineEntry.vue            一条事件：图标点 + 作者 + 动作 + 相对/绝对时间 + 摘要 + 原文 ↗
      TimelineGroup.vue            bot-group / ci-group 的折叠行，点开展开
      SettingsSheet.vue            BYOK 设置，从 index.vue 原样搬出（改中文）
  composables/
    useInbox.ts                    fetch /api/inbox、刷新、revalidate 轮询（从 index.vue 搬）、派生分区
    useSeen.ts                     已读批量 POST + 乐观更新
    usePrefs.ts                    稍后/星标
    useTimeline.ts                 fetch /api/timeline，按 unitId 内存缓存
    useTheme.ts                    从 index.vue 搬 setTheme/onThemeKey
    useShortcuts.ts                键盘：j/k 移动、Enter/o 打开预览、Esc 关闭、s 星标、l 稍后、e 已读、g h 回首页
    useMedia.ts                    matchMedia('(max-width: 760px)')，决定 panel 还是 sheet
  utils/
    reason.ts                      ReasonCode → 中文
    time.ts                        相对时间（「2 小时前」「4 天」）+ 绝对时间（「10月21日 14:03」），基于 Intl
    greeting.ts                    早上好/下午好/晚上好 + 计数句子
    category.ts                    UnitCategory / ContributionType → 中文
    paper.ts                       保留
  assets/css/
    tokens.css                     从 board.css 第 1-133 行拆出（token、字体、reset、paper）；补 --card
    inbox.css                      新布局与卡片
    board.css                      删除
```

### 3.1 卡片规格

| 分区 | 尺寸 | 内容 |
| --- | --- | --- |
| 轮到我 | large，grid `minmax(280px,1fr)`，最小高 150px | 第一行 mono：`repo` + 未读点 · 相对时间；第二行 **原因，accent 色**（`reason.ts`，clef 时显示 quote）；标题 `#n title`；描述：关联 issue「关联 #506」、marks、labels；虚线卡额外「还没有 PR」 |
| 有动静 | row，横向滚动 `flex: 0 0 260px`，右缘 mask 渐隐 | 元信息 + 未读点；标题；一句「最近一条动静」摘要（`reason.ts` 的被动语态，如「维护者批准了 workflow」） |
| 等别人 | small，`flex: 0 0 200px`，`opacity: .75` | `repo#n` · 天数（`tone` 黄/红上色，只影响这个数字）；一行「等维护者 / 等提问者 / 等其他人」 |
| 已结束 | small，`<details>` 默认收起 | 已合并 / 已关闭 + 日期 |

虚线卡：`border-style: dashed`，背景透明（不用 `--card`），标题前加 mono `issue` 前缀。`fixedBy` 时描述写「已由 @x 的 #n 修复 ↗」。

卡片点击：打开预览并标已读。卡上不再放三个「Open PR / latest comment / CI log」按钮；这些链接移到预览头部和时间线条目的「原文 ↗」。

### 3.2 预览面板

- 桌面（≥1100px）：三栏 grid `200px 1fr 440px`，panel 常驻右侧，未选卡时显示「选一张卡看时间线」。760–1100px：panel 从右侧滑出覆盖 main（`transform` + `var(--ease)` 320ms），背后加半透明遮罩。
- 头部：mono `repo#n · 已开 3 天`、标题（Instrument Serif 22px）、state 徽章、关联 issue 列表（每行 `#506 标题 · open · 原文 ↗`，`sharedWith` 写「也被 #540 引用」）、`history` 折叠「之前的 PR：#498（已关闭）」、原因行（accent）。按钮：稍后、星标、在 GitHub 打开 ↗。
- 时间线：日期分隔（mono「10月20日 周一」）；每条左侧小圆点（颜色按 kind：评论 fg、review changes-requested accent、CI 失败 accent、合并绿用 `--lig-*-diag-info`）；正文行「**作者** 动作」+ 右侧 mono 相对时间，hover/长按显示绝对时间（`<time datetime title>`）；摘要 muted 两行截断，点「展开」显示全文摘要（仍是纯文本，不渲染 markdown，避免 XSS）；「原文 ↗」。
- 来源标记：每条右上 mono 小字 `PR #531` / `issue #506`，只有多个来源时显示。
- viewer 自己的动作用「你」代替 login。
- 加载中骨架 3 行；失败显示错误 + 重试；`truncated` 时底部提示「更早的动静没拉全 · 原文 ↗」。
- URL 同步 `?open=<unitId>`，刷新和分享链接能直接打开；浏览器返回键关闭面板。

---

## 4. 移动端（主人在手机上看）

断点 `760px` 以下：

1. **导航**：侧栏隐藏。顶部 sticky 一行：logo（Instrument Serif 20px）+ 头像。下面一行横向滚动 chip：首页 3 · 稍后 · 星标 · 认领修复 · 直接 PR · 只提 issue · 帮人排查 · 已结束。当前项实心。chip 高 32px，触控区 ≥ 40px（用 padding）。
2. **问候**：字号 `clamp(22px, 6vw, 30px)`，计数句单独一行。
3. **轮到我**：单列，卡片全宽。
4. **有动静**：保持横向滚动，卡宽 `78vw`，`scroll-snap-type: x mandatory`，露出下一张的边让人知道能滑。
5. **等别人**：两列 grid（不是 flex-wrap 固定 200px，否则窄屏剩一列加大空白）。
6. **已结束**：收起。
7. **预览**：全屏 sheet，从底部滑上（`translateY`，`var(--ease)`），顶部有 grabber 和「关闭」；下拉超过 80px 关闭；`overscroll-behavior: contain`，打开时给 `body` 加 `overflow: hidden`。头部 sticky，时间线可滚动。底部 sticky 操作条：稍后 · 星标 · 在 GitHub 打开 ↗（`env(safe-area-inset-bottom)` 留白）。
8. 没有 hover：卡片的 `translateY(-2px)` 只在 `@media (hover: hover)` 里生效。长按卡片弹出「标为已读 / 稍后 / 星标」小菜单（用 `contextmenu` 事件，iOS 上也触发）。
9. 字号底线 14px，mono 元信息 12px；`-webkit-text-size-adjust: 100%`；`<meta viewport>` 已由 Nuxt 默认给出，确认一下。
10. 刷新：顶部头像菜单里的「刷新」；不做下拉刷新（和 sheet 的下拉关闭冲突）。

验收用 Chrome DevTools 的 iPhone 14 Pro（393×852）和 iPad Mini（768×1024）各看一遍，再用真机打开分支预览。

---

## 5. 单用户 → 多用户：必须改的地方

### 5.1 代码里写死的 0froq

| 位置 | 现在 | 改成 |
| --- | --- | --- |
| `shared/identity.ts:3` `SELF = '0froq'`，`viewerLoginOf` 兜底 `SELF`，`isSelf(actor, viewer = SELF)` | 默认 0froq | 删 `SELF`；`viewerLoginOf` 在缺 `viewerLogin` 时抛错（数据管线漏传就该炸）；`isSelf` 的 `viewer` 改必填 |
| `shared/turn.ts:26` 重新导出 `SELF` | | 删掉这个导出 |
| `shared/turn-rules.ts:33` `mentionsSelf(body, viewer = '0froq')`、`:77` `isMaintainerActivity(activity, viewer = '0froq')` | 默认参数 | 改必填 |
| `shared/timeline.ts:99` `isSelf(link.author)` | 漏传 viewer，实际按 0froq 判 | 传 `viewerLoginOf(item)`；stub 带 `viewerLogin` |
| `server/turn-classifier.ts:118`、`server/claim-classifier.ts:29` `?? '0froq'` | 兜底 | 改成必须有 `env.viewerLogin`，否则抛错 |
| `server/byok.ts:52,57` `clefEnabledForUser` / `usesWorkersAiClef` 只认 0froq | 站长特权写死 | 读 `OSDASH_CLEF_LOGINS`（逗号分隔，小写比较；`env.ts` 用 `defineEnv` 声明，生产 `void secret put` 或 vars 写 `0froq`）。函数签名加 `allowList: readonly string[]` |
| `server/api/board.get.ts:23` mock 返回 `viewerLogin: '0froq'` | | mock 用 `MOCK_VIEWER = 'octo-dev'` |
| `server/mock.ts` 15 处 `user('0froq')` | | 全部换 `user(MOCK_VIEWER)`；样例改为 unit 形状 |
| 各 `*.test.ts` 里的 `'0froq'` | | 保留也行（它们是测试输入），但 `isSelf` 改必填后需要显式传 viewer；建议统一用 `const VIEWER = 'octo-dev'`，顺带证明没有隐式依赖 0froq |

`isSelf` 改必填之后，`vp run check` 的类型检查会把每个漏传的调用点列出来，这是这一步的验收手段。

### 5.2 文案和界面

| 位置 | 现在 | 改成 |
| --- | --- | --- |
| `nuxt.config.ts:38` `htmlAttrs: { lang: 'en' }` | | `zh-CN` |
| `nuxt.config.ts:40` description「Read-only dashboard for froQ open-source contributions」 | 单用户 | 「用 GitHub 登录，看你自己的开源贡献进展。只读。」 |
| `nuxt.config.ts` `robots: index,follow` | | 首页需要登录，改 `noindex`；登录页可以 index（用 `useHead` 分页覆盖） |
| `package.json:5` description「froQ's read-only…」 | | 「Read-only dashboard of your open-source contributions.」 |
| `app/pages/index.vue:296-297` 「{login} · read-only」/「open-source contributions, read-only」 | | 侧栏底部 viewer 头像 + 名字；「只读」挪到登录页和设置里说明 |
| `app/pages/index.vue:391-392` 「Workers AI clef stays on for 0froq only.」 | 暴露站长 login | 「站点内置分类器只对部分账号开放。你可以填自己的 OpenAI 兼容接口，用来判断说不清楚的回合。」若当前用户在 allow list 里，显示「已启用站点分类器」 |
| `index.vue` 的「Mine / Maintainer / Other / None」列名、`turnLabel` | | 删除；改用 轮到我 / 有动静 / 等别人 / 已结束 |
| `index.vue:300` 键盘提示「h / l groups · j / k move · o open」 | | 移到头像菜单的「快捷键」；手机不显示 |
| `index.vue:305` 「capped at 100」 | 实际上限是 5 查询 × 5 页 × 25 | 「结果被截断，只显示最近的部分」 |
| `index.vue` 统计行「Merged · Open · avg first reply」 | | 并入问候句下方一行 mono：「近 14 天合并 4 · 进行中 9 · 平均首次回复 1d 3h」 |
| `app/pages/login.vue` 「Your open-source contribution board」「Sign in with GitHub」「read:user scope」 | 英文 | 「osdash」大字 + 一句「看你的 PR 和 issue 现在轮到谁」+「用 GitHub 登录」+ 说明「只请求 `read:user`，只读公开数据，不会替你评论或合并」 |
| `shared/contribution.ts` `contributionLabel` 英文 | | 前端用 `utils/category.ts` 出中文；`contributionLabel` 留给测试或删除 |
| `shared/turn.ts` 原因文本（`'Claimed, open a PR'` 等） | 英文、句式按「我」写 | 保留英文给测试和 clef；UI 走 `reasonCode` |
| `DerivedMark` `"said I'd do it but haven't"` | 第一人称 | UI 文案「说了要做还没动」「停了 14 天以上」 |
| 问候句 | demo 写死「froQ」 | `viewer.name ?? viewer.login` |
| 空态 | 无 | 新用户 0 条时：「还没找到你在别人仓库里的 PR 或 issue。osdash 只看公开仓库、最近 14 天关闭的和所有开着的。」 |
| 错误：401 跳登录 | 有 | 保留；502 显示「GitHub 暂时没响应，稍后刷新」，403/429 显示「GitHub 限流了」 |

### 5.3 文档

- `README.md:3,10,21` 里「Clef for `0froq` only」改成 `OSDASH_CLEF_LOGINS`；新增 `/api/inbox`、`/api/timeline`、`/api/seen`、`/api/prefs` 和新的 KV 键前缀说明。
- `AGENTS.md`「数据」一节还写着 `author:0froq -user:0froq`、「0froq 的问句」等，改成「viewer」口径，并补 unit / myTurn / 未读的规则（本计划第 2 节的精简版）。生产域名 `osdash.froq.me`、`LICENSE` 的版权人保持不变，它们本来就是站点所有者的信息。

---

## 6. 样式 token

沿用 `board.css` 已有的 token（它就是从 lig 的 `kit.css` 抄的），补齐 demo 里用到的：

```css
:root {
  --bg: #f4f2ec; --card: #fbfaf6; --fg: #1a1917; --muted: #85837c; --faint: #cfccc3;
  --line: #1a19171f; --accent: #e8431f;
  --font-display: 'Instrument Serif', …;  /* 问候句、logo、预览标题 */
  --font-text: 'Geist Variable', …;       /* 正文 */
  --font-meta: 'Geist Mono Variable', …;  /* 元信息、分区标题、计数、时间 */
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
  --radius-card: 12px;                    /* demo 的卡片圆角；现有 --radius: 2px 留给按钮/chip 之外的细节 */
}
:root[data-theme='dark'] { --bg: #111113; --card: #18181a; --fg: #f2f0ea; --muted: #918f88; --faint: #32312d; --line: #f2f0ea1a; --accent: #ff6242; }
```

- 字体已经通过 `@fontsource` 自托管（`nuxt.config.ts:9-14`），**不要**照 demo 引 Google Fonts。
- 主题切换沿用 `data-theme` + `kit-theme` localStorage（`app/theme.ts`），不改成只跟系统。
- feeds 风格的 chip：`font: 12px var(--font-meta)`，`border: 1px solid var(--line)`，选中时 `background: var(--fg); color: var(--bg)`，计数用 muted。
- 「原文 ↗」：mono 12px muted，hover 变 accent，`target="_blank" rel="noreferrer"`。
- `prefers-reduced-motion` 时关掉位移动画（现有 `board.css:508` 有这段，搬过去）。

---

## 7. 实施清单（按顺序；每步一个 commit，每步都要 `vp run check` 和 `vp run test` 通过）

每步都写明「改哪些文件」和「怎么验收」。UI 不写测试（AGENTS.md），UI 步骤的验收是 `pnpm dev` 打开 `http://localhost:3000/?mock=1` 手动看。

### 第一阶段：清掉单用户残留（不改 UI）

**1. `isSelf` / turn-rules 的 viewer 改必填**
- 文件：`shared/identity.ts`、`shared/turn.ts`（删 `SELF` 导出）、`shared/turn-rules.ts`、`shared/timeline.ts`（第 99 行传 viewer，stub 带 `viewerLogin`）、所有因此报错的调用点和测试。
- `viewerLoginOf` 缺值时抛 `Error('viewerLogin missing')`。
- 验收：`rg -n "0froq" shared server --glob '!*.test.ts'` 只剩 `server/mock.ts`、`server/byok.ts`、两个 classifier 的兜底（下一步处理）；check/test 绿。新增一个 `shared/timeline.test.ts` 用例：viewer 是 `octo-dev` 时，`0froq` 作者的 linked PR 不会被扩成 stub。

**2. classifier 兜底和 clef allow list**
- 文件：`server/turn-classifier.ts:118`、`server/claim-classifier.ts:29`、`server/byok.ts`、`server/bindings.ts`（加 `OSDASH_CLEF_LOGINS`）、`env.ts`、`server/byok.test.ts`、`README.md`。
- 验收：`rg -n "0froq" server --glob '!*.test.ts' --glob '!mock.ts'` 为空；`byok.test.ts` 覆盖：allow list 为空时谁都没有 Workers AI；`'0froq, Foo '` 能匹配 `foo`。

**3. mock 换成虚构用户**
- 文件：`server/mock.ts`（`export const MOCK_VIEWER = 'octo-dev'`）、`server/api/board.get.ts:23`。
- 验收：`rg -n "0froq" server app shared --glob '!*.test.ts'` 为空；`?mock=1` 的旧看板仍能显示（此时 UI 还没换）。

**4. 会话带 name / avatar**
- 文件：`server/auth/github-oauth.ts`（`fetchGitHubUser`）、`server/api/auth/callback.get.ts`、`server/session-store.ts`、`server/middleware/session.ts`（`H3EventContext` 类型）、`server/api/auth/me.get.ts`、`server/session.test.ts`。
- 验收：`session.test.ts` 加用例：旧 record（无 name）能读出，`name` 为 `undefined`。

### 第二阶段：数据模型

**5. `reasonCode`**
- 文件：新建 `shared/reason.ts`；改 `shared/turn.ts`（`Verdict` 加 `reasonCode`、`reasonActor`；`humanReason`/`reviewReason`/`coreVerdict` 每个分支给 code；`withResolvedTurn` 设 `'clef'`）。
- 验收：现有 `shared/turn.test.ts` 全部不改就能过（`reason` 文本没变）；新增断言：每个规则分支的 `reasonCode` 正确（至少 CI 失败、CHANGES_REQUESTED、mentioned、claimed-open-pr、merged 五个）。

**6. GraphQL 加 `closingIssuesReferences`**
- 文件：`server/github.ts`（`PULL_REQUEST_FIELDS`、`RawNode`、`mapNode`）、`shared/turn.ts`（`Item.closingIssues?`）、`server/github-queries.test.ts`。
- 验收：`github-queries.test.ts` 断言查询字符串包含 `closingIssuesReferences`；新增 `mapNode` 单测：给一个带 2 个 closing issue 的 raw node，得到 2 条 `closingIssues`。

**7. `shared/unit.ts` 类型 + `shared/units.ts` 组单位**
- 只写纯函数 `buildUnitDrafts(items: Item[]): UnitDraft[]` 和 `unitCategory(...)`，不接线。
- 从 `shared/timeline.ts` 导出 `combine`（改名 `combineItems`）。
- 新建 `shared/units.test.ts`，至少这些用例：
  1. viewer PR + closing issue → 1 张 PR 卡，`issues.length === 1`，`link: 'closing'`。
  2. viewer PR 无 issue → `direct-pr`。
  3. viewer 认领的 issue，无 PR → 1 张 issue-only，`category: 'helped'`（或作者是 viewer 时 `reported`）。
  4. 同一 issue：PR#1 closed 未合并、PR#2 在 1 小时后创建 → 1 张卡，`history` 含 #1。
  5. 同一 issue：PR#1、PR#2 都开着 → 2 张卡，各自 `sharedWith` 指向对方。
  6. viewer 的 issue 被别人的 PR 修 → issue-only，`fixedBy` 指向那个 PR，别人的 PR 不成卡。
  7. timeline 里别人 PR 的 ghost stub 不成卡。
  8. 一个 PR 关联两个 issue → 1 张卡，2 个 `UnitIssue`。
- 验收：test 绿。

**8. `toUnit`：draft → Unit**
- 文件：`shared/units.ts` 加 `toUnit(draft, verdict, nowMs)`；`lastOtherActivityAt` 计算；`myTurn`/`ended`。
- 单测：`judge` 给 `mine` → `myTurn: true`；`maintainer`/`other` → false；merged → `ended: true, myTurn: false`；`lastOtherActivityAt` 跳过 viewer 和被丢弃的 bot，但不跳过 CLA 失败评论。

**9. `loadBoard` 改成 `loadUnits`**
- 文件：`server/github.ts`（`loadBoard` → `loadUnits`，返回 `{ units: Unit[]; truncated }`；`mergeLinkedItems` 不再被调用）、`server/turn-classifier.ts`（`maybeClassifyTurn` 改吃 `Verdict` 而不是 `BoardItem`，签名泛型已经是 `T extends Verdict`，确认即可）、可选的 `hydrateMissingClosingIssues`。
- `present` 和 `BoardItem` 此时还被旧 UI 用，先保留，第 17 步删。
- 验收：check/test 绿。

**10. `GET /api/inbox` + 用户状态**
- 新建：`server/inbox-response.ts`（从 `board-response.ts` 搬，缓存键 `inbox:v1:{login}`）、`server/user-state.ts`（`readSeen`/`writeSeen`/`readPrefs`/`writePrefs`、裁剪逻辑、`mergeUserState(units, seen, prefs, nowMs): UnitView[]`、`inboxCounts`）、`server/api/inbox.get.ts`、`server/api/seen.post.ts`、`server/api/prefs.put.ts`。
- mock：`server/mock.ts` 加 `mockUnits(nowMs)`，覆盖：3 张轮到我（含 1 张虚线「认领 4 天没 PR」）、1 张有动静、4 张等别人（tone 各种）、2 张已结束、1 张带 history、2 张分拆、1 张 fixedBy。
- 新建 `server/user-state.test.ts`：首次读写入 `baselineAt`；`unread` 的三种情况（无 seen 且早于 baseline → 读过；晚于 seen → 未读；viewer 自己的评论不算）；`later` 过期回到原分区；`seen` 裁剪。
- 验收：test 绿；`curl localhost:3000/api/inbox?mock=1 | jq '.counts'` 数字和样例一致。

**11. 标准化事件 + enrichment 缓存**
- 新建 `shared/events.ts`（类型 + `normalizeRestTimeline` + `normalizeReviewComments` + `normalizeCheckRuns` + `foldEntries`）和 `shared/events.test.ts`（每种 REST `event` 一个最小 fixture；bot 折叠：3 条 vercel 评论夹一条 CLA 失败 → `bot-group(2)`、CLA 单独一条、`bot-group(1)`…按实际顺序断言）。
- 改 `server/github-rest.ts`：`loadTimeline` 拉到的事件同时写 `events:v1:…`；导出 `loadTimeline`、`loadCheckRuns`（后者保留时间字段）。
- 验收：test 绿；enrichment 的请求数不变（看 `console.warn` 之外没有新的 fetch，单测里 mock `fetch` 计数）。

**12. `GET /api/timeline`**
- 新建 `server/timeline-response.ts`、`server/api/timeline.get.ts`；mock 时间线放 `server/mock.ts` 的 `mockTimeline(unitId)`。
- 新建 `server/timeline-response.test.ts`（mock fetch）：PR + issue 两个来源合并后严格按时间升序；cross-ref 在两边各出现一次时只保留一条；不在用户看板里的 id 返回 404；`refresh=1` 不读缓存。
- 验收：test 绿；`curl '/api/timeline?mock=1&id=pr:…'` 返回有序 entries。

### 第三阶段：界面

**13. 样式拆分**
- `app/assets/css/board.css` 第 1-133 行 → `tokens.css`（补 `--card`、`--radius-card`），新建空的 `inbox.css`；`nuxt.config.ts` 的 `css` 数组换成这两个。旧看板样式暂时留在 `board.css` 里继续 import，第 17 步删。
- 验收：页面看起来和之前一样；check 绿。

**14. 骨架：Shell / Sidebar / MobileNav / Greeting / Section / UnitCard（只读展示）**
- 新建 `app/components/inbox/*` 中这几个、`app/composables/useInbox.ts`、`useTheme.ts`、`useMedia.ts`、`app/utils/{reason,time,greeting,category}.ts`；`index.vue` 改为调用它们，数据源换 `/api/inbox`。
- `lang="zh-CN"`、description、robots（5.2 表）。
- 验收（手动，`?mock=1`）：桌面三区布局和 `inbox.html` 一致；四个分区计数和 `counts` 一致；轮到我卡片第一行原因是 accent 色；虚线卡是虚线；「已结束」默认收起；暗色主题下 token 正确；393px 宽度下侧栏变 chip 行、轮到我单列、有动静横滑带 snap、等别人两列。

**15. 侧栏筛选 + repo chip + 稍后/星标视图**
- `Sidebar.vue`/`MobileNav.vue` 点击改 `?view=home|later|starred|ended` 和 `?cat=<category>`；`FilterChips.vue` 做 repo 筛选，计数随 view/cat 变化。
- `usePrefs.ts`、卡片长按/右键菜单。
- 验收（手动）：每个 category 的计数和点进去的卡数一致；星标后刷新页面仍在；稍后选「明天早上」后卡从首页消失、出现在「稍后」。

**16. 预览面板 + 时间线 + 已读**
- 新建 `PreviewPanel.vue`、`PreviewHeader.vue`、`Timeline.vue`、`TimelineEntry.vue`、`TimelineGroup.vue`、`useTimeline.ts`、`useSeen.ts`、`useShortcuts.ts`。
- 验收（手动）：点卡打开面板，URL 出现 `?open=`，刷新后仍打开；时间线日期分组、作者、相对时间、`title` 里的绝对时间、摘要、「原文 ↗」都在；bot 折叠行能展开；CLA / CodeRabbit 不被折叠；打开后「有动静」那张卡移到「等别人」，未读点消失，刷新后仍是已读；Esc / 返回键关闭；手机宽度下是从底部滑上的全屏 sheet，下拉关闭，背景不滚动；`j/k/Enter/Esc/s/l/e` 在桌面可用。

**17. 删旧看板**
- 删 `server/api/board.get.ts`、`server/board-response.ts`、`app/assets/css/board.css` 里剩余的看板样式（或整个文件）；`shared/turn.ts` 删 `present`、`BoardItem`、`turnLabel`；`shared/timeline.ts` 的 `mergeLinkedItems` 若无调用方则删，连同只测它的用例迁到 `units.test.ts`。设置弹窗搬进 `SettingsSheet.vue`（中文文案，5.2 表）。登录页改版。
- 验收：`rg -n "BoardItem|turnLabel|/api/board|mergeLinkedItems" app server shared` 为空；check/test 绿；`pnpm build` 成功（AGENTS.md 提到页面要用 `#shared/...` 别名引用 shared，否则 Nitro 构建失败——新组件全部按这个写）。

**18. 文档**
- 更新 `README.md`、`AGENTS.md` 数据一节（5.3）。
- 验收：`rg -n "0froq" README.md AGENTS.md` 只剩「OSDASH_CLEF_LOGINS 生产值示例」这一处。

**19. 手机真机验收**
- 推分支触发 Workers Builds 预览（`pnpm preview:deploy`，不要本地跑 wrangler），在手机上用 GitHub 登录。
- 验收清单：首屏 3 秒内出内容（有缓存时）；问候句是自己的名字；横滑、sheet、长按菜单都可用；没有横向溢出（`document.documentElement.scrollWidth === innerWidth`）；暗色模式；iOS 安全区底部操作条不被遮挡。

---

## 8. 风险和待定

- **KV 写频率**：`seen` 每用户一个键，Workers KV 同键 1 次/秒。前端批量 + 防抖已经覆盖正常使用；如果以后要多设备高频，再换 Durable Object。
- **REST 配额**：预览接口每张卡最多 `members × (3 页 timeline + 1 review comments + 1 check runs)` 个请求。用户自己的 OAuth token 是 5000/小时，正常够；`StopFlag` 遇到 403/429 停手并在响应里标 `truncated`。
- **closingIssuesReferences 只认同仓库和写了关键字的 PR**：跨仓库 `Fixes owner/repo#1` GitHub 也会解析，但没写关键字的 PR 只能靠 cross-ref，算 `mention`。这和「不从正文猜」的规则一致。
- **取代判断的 24 小时窗口**是经验值，写成常量 `SUPERSEDE_WINDOW_MS`，样例不对再调。
- **CI 事件只看 head sha**：旧 commit 的 CI 失败不会出现在时间线里；force-push 之后旧结果本来也没意义。
- **文案语言**：demo 是中文，所以 UI 定为中文；规则里的英文原因句保留给测试和 clef 提示词。以后要双语，`reason.ts` / `category.ts` 是唯一的入口。
