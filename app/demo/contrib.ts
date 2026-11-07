import { isClaimComment } from '#shared/claim-keywords'
import { isMaintainerAssociation } from '#shared/claim-types'
import type { ReasonCode } from '#shared/reason'
import type { TFunc } from '#shared/i18n'
import { reasonText } from '~/utils/reason'

/*
 * Demo v3. Fixtures only hold fields the fetcher already has: GraphQL items
 * (author, authorAssociation, state, closingIssuesReferences), REST timeline
 * events, reviews and check runs. Every visible string is built from them by
 * the rules below. No model output is used.
 */

type Association = 'OWNER' | 'MEMBER' | 'COLLABORATOR' | 'CONTRIBUTOR' | 'NONE'

type RawItem = {
  key: string
  kind: 'issue' | 'pr'
  number: number
  title: string
  author: string
  state: 'open' | 'closed' | 'merged'
  /** closingIssuesReferences. */
  closes?: string[]
  /** Issues referenced without a closing keyword. Not part of the card. */
  mentions?: number[]
}

type RawKind =
  | 'opened'
  | 'comment'
  | 'assigned'
  | 'review'
  | 'review_requested'
  | 'commits'
  | 'checks'
  | 'cross-ref'
  | 'labeled'
  | 'closed'
  | 'merged'

type RawEvent = {
  id: string
  item: string
  /** Hours before now. */
  h: number
  kind: RawKind
  actor: string
  association?: Association
  bot?: boolean
  body?: string
  review?: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED'
  target?: string
  label?: string
  ref?: number
  commits?: number
  checks?: { failed: string[]; passed: number }
  /** closed event on an issue whose closer is a merged PR. */
  closer?: string
}

type Scenario = {
  id: string
  tab: string
  archetype: string
  repo: string
  viewer: string
  primary: string
  category: 'claimed-fix' | 'direct-pr' | 'reported' | 'helped'
  turn: Turn
  items: RawItem[]
  events: RawEvent[]
  reason: { code: ReasonCode; actor: string | null; event: string }
  notes: { h: number; text: string }[]
}

export type Turn = 'you' | 'waiting' | 'done'
export type Tag = 'claim' | 'maintainer' | 'reason'

export type ItemView = {
  key: string
  kind: 'issue' | 'pr'
  number: number
  title: string
  state: 'open' | 'closed' | 'merged'
  author: string
  mine: boolean
  primary: boolean
  relation: string
}

export type Line = {
  id: string
  at: number
  item: string
  key: boolean
  actor: string
  verb: string
  chips: string[]
  quote: string | null
  tags: Tag[]
  tone: 'plain' | 'bad' | 'good'
  source: string
  start: boolean
  /** Issues this PR branches out of (its closing issues), on its opened line. */
  fork: string[]
  /** Issues closed by this merge. */
  joins: string[]
  end: 'merged' | 'closed' | null
}

export type Block =
  | { type: 'line'; id: string; line: Line }
  | { type: 'fold'; id: string; lines: Line[]; summary: string }

export type Next = { who: string; text: string }

export type Contribution = {
  id: string
  tab: string
  archetype: string
  repo: string
  category: string
  primary: ItemView
  items: ItemView[]
  mentions: number[]
  blocks: Block[]
  turn: Turn
  now: { text: string; at: number; days: number; source: string }
  next: Next[]
  notes: { at: number; text: string }[]
}

const HOUR = 3_600_000

const CATEGORY: Record<Scenario['category'], string> = {
  'claimed-fix': 'Claimed fix',
  'direct-pr': 'Pull request',
  'reported': 'Reported',
  'helped': 'Helped',
}

const SCENARIOS: Scenario[] = [
  {
    id: 'vite',
    tab: '1 · 接手别人的 issue',
    archetype:
      '接手别人的 issue，认领、被 assign。第一个 PR 关掉，第二个 PR 同时 close 两个 issue，另外 mention 一个。',
    repo: 'vitejs/vite',
    viewer: 'froq',
    primary: 'p18820',
    category: 'claimed-fix',
    turn: 'you',
    items: [
      {
        key: 'i18790',
        kind: 'issue',
        number: 18790,
        title: 'transformIndexHtml drops the CSP nonce on injected scripts',
        author: 'kricsleo',
        state: 'open',
      },
      {
        key: 'i18811',
        kind: 'issue',
        number: 18811,
        title: 'Preload links miss the nonce in dev',
        author: 'n0099',
        state: 'open',
      },
      {
        key: 'p18801',
        kind: 'pr',
        number: 18801,
        title: 'fix(html): forward nonce to injected scripts and preload links',
        author: 'froq',
        state: 'closed',
        closes: ['i18790'],
      },
      {
        key: 'p18820',
        kind: 'pr',
        number: 18820,
        title: 'fix(html): keep the CSP nonce on injected tags',
        author: 'froq',
        state: 'open',
        closes: ['i18790', 'i18811'],
        mentions: [18801, 18833],
      },
    ],
    events: [
      { id: 'v1', item: 'i18790', h: 290, kind: 'opened', actor: 'kricsleo' },
      { id: 'v2', item: 'i18790', h: 289, kind: 'labeled', actor: 'bluwy', label: 'p3-minor-bug' },
      {
        id: 'v3',
        item: 'i18790',
        h: 280,
        kind: 'comment',
        actor: 'kricsleo',
        association: 'CONTRIBUTOR',
        body: 'Repro: https://stackblitz.com/edit/vite-nonce-18790',
      },
      {
        id: 'v4',
        item: 'i18790',
        h: 266,
        kind: 'comment',
        actor: 'froq',
        association: 'CONTRIBUTOR',
        body: 'I can take this one. The fix probably belongs in the html plugin.',
      },
      {
        id: 'v5',
        item: 'i18790',
        h: 262,
        kind: 'comment',
        actor: 'patak-dev',
        association: 'MEMBER',
        body: 'Thanks! Please keep the change inside the html plugin.',
      },
      { id: 'v6', item: 'i18790', h: 262, kind: 'assigned', actor: 'patak-dev', target: 'froq' },
      { id: 'v7', item: 'p18801', h: 240, kind: 'opened', actor: 'froq' },
      { id: 'v8', item: 'p18801', h: 240, kind: 'commits', actor: 'froq', commits: 3 },
      {
        id: 'v9',
        item: 'p18801',
        h: 239,
        kind: 'checks',
        actor: 'github-actions',
        checks: { failed: [], passed: 14 },
      },
      {
        id: 'v10',
        item: 'p18801',
        h: 239,
        kind: 'comment',
        actor: 'coderabbitai',
        bot: true,
        body: 'Walkthrough…',
      },
      { id: 'v11', item: 'i18811', h: 216, kind: 'opened', actor: 'n0099' },
      {
        id: 'v12',
        item: 'p18801',
        h: 200,
        kind: 'comment',
        actor: 'patak-dev',
        association: 'MEMBER',
        body: 'This also changes the dev server path. Could we cover #18811 in the same place and keep the diff smaller?',
      },
      { id: 'v13', item: 'p18820', h: 170, kind: 'opened', actor: 'froq' },
      { id: 'v15', item: 'p18801', h: 171, kind: 'closed', actor: 'froq' },
      { id: 'v16', item: 'p18820', h: 169, kind: 'commits', actor: 'froq', commits: 2 },
      {
        id: 'v17',
        item: 'p18820',
        h: 168,
        kind: 'checks',
        actor: 'github-actions',
        checks: { failed: [], passed: 14 },
      },
      {
        id: 'v18',
        item: 'p18820',
        h: 168,
        kind: 'review_requested',
        actor: 'froq',
        target: 'patak-dev',
      },
      {
        id: 'v19',
        item: 'p18820',
        h: 167,
        kind: 'comment',
        actor: 'coderabbitai',
        bot: true,
        body: 'Walkthrough…',
      },
      {
        id: 'v20',
        item: 'p18820',
        h: 120,
        kind: 'comment',
        actor: 'kricsleo',
        association: 'CONTRIBUTOR',
        body: 'Tested this branch on my app. The nonce is there now.',
      },
      { id: 'v21', item: 'p18820', h: 50, kind: 'commits', actor: 'froq', commits: 1 },
      {
        id: 'v22',
        item: 'p18820',
        h: 49,
        kind: 'checks',
        actor: 'github-actions',
        checks: { failed: [], passed: 14 },
      },
      {
        id: 'v23',
        item: 'p18820',
        h: 26,
        kind: 'review',
        actor: 'patak-dev',
        association: 'MEMBER',
        review: 'CHANGES_REQUESTED',
        body: 'Please add a playground test for the preload case.',
      },
    ],
    reason: { code: 'changes-requested', actor: 'patak-dev', event: 'v23' },
    notes: [
      { h: 30, text: 'Preload tags are built in plugins/html.ts, not in the dev middleware.' },
    ],
  },
  {
    id: 'h3',
    tab: '1 · 被别人修掉',
    archetype: '认领了别人的 issue 并开了 PR。维护者用自己的 PR 修掉了它，我的 PR 被关掉。',
    repo: 'unjs/h3',
    viewer: 'froq',
    primary: 'p918',
    category: 'claimed-fix',
    turn: 'done',
    items: [
      {
        key: 'i912',
        kind: 'issue',
        number: 912,
        title: 'readBody throws on an empty JSON body',
        author: 'kanadess',
        state: 'closed',
      },
      {
        key: 'p918',
        kind: 'pr',
        number: 918,
        title: 'fix: return undefined for an empty JSON body',
        author: 'froq',
        state: 'closed',
        closes: ['i912'],
      },
      {
        key: 'p931',
        kind: 'pr',
        number: 931,
        title: 'refactor: unify body parsing',
        author: 'pi0',
        state: 'merged',
        closes: ['i912'],
      },
    ],
    events: [
      { id: 'h1', item: 'i912', h: 400, kind: 'opened', actor: 'kanadess' },
      {
        id: 'h2',
        item: 'i912',
        h: 390,
        kind: 'comment',
        actor: 'froq',
        association: 'NONE',
        body: "I'd like to work on this. I'll open a PR this week.",
      },
      { id: 'h3', item: 'p918', h: 360, kind: 'opened', actor: 'froq' },
      { id: 'h4', item: 'p918', h: 360, kind: 'commits', actor: 'froq', commits: 2 },
      {
        id: 'h5',
        item: 'p918',
        h: 359,
        kind: 'checks',
        actor: 'github-actions',
        checks: { failed: [], passed: 6 },
      },
      { id: 'h6', item: 'p931', h: 300, kind: 'opened', actor: 'pi0' },
      { id: 'h7', item: 'p931', h: 250, kind: 'merged', actor: 'pi0' },
      { id: 'h8', item: 'i912', h: 250, kind: 'closed', actor: 'pi0', closer: 'p931' },
      {
        id: 'h9',
        item: 'p918',
        h: 249,
        kind: 'comment',
        actor: 'pi0',
        association: 'OWNER',
        body: 'Fixed by #931 as part of the body parsing refactor. Thanks for the PR!',
      },
      { id: 'h10', item: 'p918', h: 249, kind: 'closed', actor: 'pi0' },
    ],
    reason: { code: 'closed', actor: null, event: 'h10' },
    notes: [],
  },
  {
    id: 'pnpm',
    tab: '2 · 自己报、自己修',
    archetype: '自己提 issue，在 issue 里说会发 PR，PR 被 approve 后合并，issue 随之关闭。',
    repo: 'pnpm/pnpm',
    viewer: 'froq',
    primary: 'p8655',
    category: 'claimed-fix',
    turn: 'done',
    items: [
      {
        key: 'i8650',
        kind: 'issue',
        number: 8650,
        title: 'pnpm dlx ignores the catalog: protocol',
        author: 'froq',
        state: 'closed',
      },
      {
        key: 'p8655',
        kind: 'pr',
        number: 8655,
        title: 'fix(dlx): resolve catalog: specifiers',
        author: 'froq',
        state: 'merged',
        closes: ['i8650'],
      },
    ],
    events: [
      { id: 'n1', item: 'i8650', h: 520, kind: 'opened', actor: 'froq' },
      {
        id: 'n2',
        item: 'i8650',
        h: 519,
        kind: 'comment',
        actor: 'froq',
        association: 'CONTRIBUTOR',
        body: "I'll send a PR for this.",
      },
      { id: 'n3', item: 'i8650', h: 500, kind: 'labeled', actor: 'zkochan', label: 'type: bug' },
      { id: 'n4', item: 'p8655', h: 470, kind: 'opened', actor: 'froq' },
      { id: 'n5', item: 'p8655', h: 470, kind: 'commits', actor: 'froq', commits: 2 },
      {
        id: 'n6',
        item: 'p8655',
        h: 469,
        kind: 'checks',
        actor: 'github-actions',
        checks: { failed: [], passed: 9 },
      },
      {
        id: 'n7',
        item: 'p8655',
        h: 330,
        kind: 'review',
        actor: 'zkochan',
        association: 'MEMBER',
        review: 'APPROVED',
        body: 'LGTM',
      },
      { id: 'n8', item: 'p8655', h: 328, kind: 'merged', actor: 'zkochan' },
      { id: 'n9', item: 'i8650', h: 328, kind: 'closed', actor: 'zkochan', closer: 'p8655' },
    ],
    reason: { code: 'merged', actor: null, event: 'n8' },
    notes: [],
  },
  {
    id: 'nuxt',
    tab: '3 · 报了，等人修',
    archetype: '自己提 issue，不打算修。补了复现之后没有 PR，一直开着。',
    repo: 'nuxt/nuxt',
    viewer: 'froq',
    primary: 'i29410',
    category: 'reported',
    turn: 'waiting',
    items: [
      {
        key: 'i29410',
        kind: 'issue',
        number: 29410,
        title: 'useFetch loses custom headers after HMR',
        author: 'froq',
        state: 'open',
      },
    ],
    events: [
      { id: 'u1', item: 'i29410', h: 480, kind: 'opened', actor: 'froq' },
      {
        id: 'u2',
        item: 'i29410',
        h: 479,
        kind: 'labeled',
        actor: 'danielroe',
        label: 'pending triage',
      },
      {
        id: 'u3',
        item: 'i29410',
        h: 460,
        kind: 'comment',
        actor: 'danielroe',
        association: 'MEMBER',
        body: 'Could you share a minimal reproduction?',
      },
      {
        id: 'u4',
        item: 'i29410',
        h: 300,
        kind: 'comment',
        actor: 'froq',
        association: 'NONE',
        body: 'Here it is: https://stackblitz.com/edit/nuxt-29410. Headers are gone after the first HMR update.',
      },
      {
        id: 'u5',
        item: 'i29410',
        h: 290,
        kind: 'labeled',
        actor: 'danielroe',
        label: 'has reproduction',
      },
      { id: 'u6', item: 'i29410', h: 150, kind: 'cross-ref', actor: 'jlo', ref: 29501 },
    ],
    reason: { code: 'replied-waiting', actor: null, event: 'u4' },
    notes: [],
  },
  {
    id: 'vue',
    tab: '4 · 只回应',
    archetype: '在别人的 issue 下补充信息，不打算提 PR。',
    repo: 'vuejs/core',
    viewer: 'froq',
    primary: 'i12403',
    category: 'helped',
    turn: 'waiting',
    items: [
      {
        key: 'i12403',
        kind: 'issue',
        number: 12403,
        title: 'Transition leaves a stale class with v-show during SSR hydration',
        author: 'kalvenschraut',
        state: 'open',
      },
    ],
    events: [
      { id: 'c1', item: 'i12403', h: 200, kind: 'opened', actor: 'kalvenschraut' },
      {
        id: 'c2',
        item: 'i12403',
        h: 180,
        kind: 'comment',
        actor: 'edison1105',
        association: 'MEMBER',
        body: 'Can you check if this still happens on 3.5.13?',
      },
      {
        id: 'c3',
        item: 'i12403',
        h: 150,
        kind: 'comment',
        actor: 'froq',
        association: 'NONE',
        body: 'Still happens on 3.5.13. It only breaks when appear is set. Repro: https://play.vuejs.org/#nuxt-12403',
      },
      {
        id: 'c4',
        item: 'i12403',
        h: 30,
        kind: 'comment',
        actor: 'kalvenschraut',
        association: 'CONTRIBUTOR',
        body: 'Confirmed, removing appear fixes it for me.',
      },
    ],
    reason: { code: 'commented', actor: 'kalvenschraut', event: 'c4' },
    notes: [],
  },
]

function excerpt(body: string | undefined): string | null {
  if (!body) return null
  const flat = body.replace(/\s+/g, ' ').trim()
  return flat.length > 140 ? `${flat.slice(0, 139)}…` : flat
}

function who(login: string, viewer: string): string {
  return login === viewer ? 'You' : login
}

function relationOf(s: Scenario, item: RawItem, primary: RawItem): string {
  if (item.key === primary.key) {
    if (item.kind === 'pr') return 'your PR'
    return item.author === s.viewer ? 'your issue' : 'you commented'
  }
  if (primary.closes?.includes(item.key)) return `#${primary.number} closes it`
  if (item.kind === 'pr' && item.author === s.viewer) {
    const linked = primary.mentions?.includes(item.number)
    return linked
      ? `earlier PR, same issue · #${primary.number} mentions it`
      : 'earlier PR, same issue'
  }
  if (item.kind === 'pr') return `${item.author}'s PR, same issue`
  return 'linked'
}

type Ctx = { s: Scenario; items: Map<string, RawItem> }

function num(ctx: Ctx, key: string): string {
  return `#${ctx.items.get(key)!.number}`
}

function keyRule(e: RawEvent, ctx: Ctx): { key: boolean; tags: Tag[]; why: string } {
  const { s } = ctx
  const tags: Tag[] = []
  let why = ''
  if (e.kind === 'opened' || e.kind === 'closed' || e.kind === 'merged') why = 'state change'
  if (e.kind === 'assigned' && e.target === s.viewer) why = 'assigned to viewer'
  if (e.kind === 'review' && (e.review === 'APPROVED' || e.review === 'CHANGES_REQUESTED'))
    why = 'review verdict'
  if (e.kind === 'comment' && !e.bot) {
    if (e.actor === s.viewer && isClaimComment(e.body ?? '')) {
      tags.push('claim')
      why = 'isClaimComment'
    } else if (e.actor === s.viewer && (s.category === 'reported' || s.category === 'helped')) {
      why = 'viewer comment on an issue-only card'
    } else if (e.actor !== s.viewer && isMaintainerAssociation(e.association)) {
      tags.push('maintainer')
      why = 'maintainer comment'
    }
  }
  if (e.kind === 'checks' && e.checks?.failed.length && e.item === s.primary) why = 'failing checks'
  if (e.id === s.reason.event) {
    tags.push('reason')
    why = why || 'judge reason event'
  }
  return { key: why !== '', tags, why }
}

function verbOf(e: RawEvent, ctx: Ctx): { verb: string; chips: string[]; tone: Line['tone'] } {
  const item = ctx.items.get(e.item)!
  const viewer = ctx.s.viewer
  switch (e.kind) {
    case 'opened': {
      const chips = [
        ...(item.closes ?? []).map(key => `closes ${num(ctx, key)}`),
        ...(item.mentions ?? []).map(n => `mentions #${n}`),
      ]
      return {
        verb: `opened ${item.kind === 'pr' ? 'PR' : 'issue'} #${item.number}`,
        chips,
        tone: 'plain',
      }
    }
    case 'comment':
      return { verb: 'commented', chips: [], tone: 'plain' }
    case 'assigned':
      return {
        verb: `assigned ${e.target === viewer ? 'you' : e.target}`,
        chips: [],
        tone: 'plain',
      }
    case 'review':
      if (e.review === 'APPROVED') return { verb: 'approved', chips: [], tone: 'good' }
      if (e.review === 'CHANGES_REQUESTED')
        return { verb: 'requested changes', chips: [], tone: 'bad' }
      return { verb: 'reviewed', chips: [], tone: 'plain' }
    case 'review_requested':
      return {
        verb: `requested review from ${who(e.target ?? '', viewer)}`,
        chips: [],
        tone: 'plain',
      }
    case 'commits':
      return {
        verb: `pushed ${e.commits} commit${e.commits === 1 ? '' : 's'}`,
        chips: [],
        tone: 'plain',
      }
    case 'checks': {
      const failed = e.checks?.failed ?? []
      if (failed.length)
        return { verb: `checks failed: ${failed.join(', ')}`, chips: [], tone: 'bad' }
      return { verb: `${e.checks?.passed} checks passed`, chips: [], tone: 'plain' }
    }
    case 'cross-ref':
      return { verb: `mentioned this in #${e.ref}`, chips: [], tone: 'plain' }
    case 'labeled':
      return { verb: `added label ${e.label}`, chips: [], tone: 'plain' }
    case 'closed':
      return { verb: `closed #${item.number}`, chips: [], tone: 'plain' }
    case 'merged':
      return { verb: `merged #${item.number}`, chips: [], tone: 'good' }
  }
}

function sourceOf(e: RawEvent, ctx: Ctx, why: string): string {
  const item = ctx.items.get(e.item)!
  const parts: string[] = []
  switch (e.kind) {
    case 'opened':
      parts.push(`GraphQL createdAt · author=${item.author}`)
      if (item.closes?.length)
        parts.push(`closingIssuesReferences: ${item.closes.map(k => num(ctx, k)).join(' ')}`)
      if (item.mentions?.length)
        parts.push(`cross-referenced: ${item.mentions.map(n => `#${n}`).join(' ')}`)
      break
    case 'comment':
      parts.push(e.bot ? 'comment · bot' : `comment · author_association=${e.association}`)
      break
    case 'review':
      parts.push(`review.state=${e.review}`)
      break
    case 'checks':
      parts.push('check runs on head sha')
      break
    case 'merged':
      parts.push(`GraphQL mergedAt · closes ${(item.closes ?? []).map(k => num(ctx, k)).join(' ')}`)
      break
    default:
      parts.push(
        `timeline ${e.kind}${e.target ? ` · ${e.kind === 'assigned' ? 'assignee' : 'reviewer'}=${e.target}` : ''}`,
      )
  }
  if (why) parts.push(`key: ${why}`)
  if (e.id === ctx.s.reason.event) parts.push(`judge → ${ctx.s.reason.code}`)
  return parts.join(' · ')
}

function foldSummary(lines: Line[], events: RawEvent[]): string {
  const comments = events.filter(e => e.kind === 'comment' && !e.bot).length
  const bots = events.filter(e => e.bot).length
  const commits = events.reduce((sum, e) => sum + (e.kind === 'commits' ? (e.commits ?? 0) : 0), 0)
  const checks = events.filter(e => e.kind === 'checks')
  const failed = checks.some(e => e.checks?.failed.length)
  const labels = events.filter(e => e.kind === 'labeled').length
  const refs = events.filter(e => e.kind === 'cross-ref').map(e => `#${e.ref}`)
  const reviews = events.filter(e => e.kind === 'review_requested').length
  const parts = [
    comments ? `${comments} comment${comments > 1 ? 's' : ''}` : '',
    commits ? `${commits} commit${commits > 1 ? 's' : ''}` : '',
    checks.length ? (failed ? 'checks failed' : 'checks passed') : '',
    reviews ? 'review requested' : '',
    labels ? `${labels} label${labels > 1 ? 's' : ''}` : '',
    refs.length ? `mentioned in ${refs.join(', ')}` : '',
    bots ? `${bots} bot${bots > 1 ? 's' : ''}` : '',
  ].filter(Boolean)
  return `${lines.length} events · ${parts.join(' · ')}`
}

const NEXT: Partial<Record<ReasonCode, (c: { primary: RawItem; actor: string | null }) => Next[]>> =
  {
    'changes-requested': ({ primary, actor }) => [
      { who: 'You', text: `push to #${primary.number}` },
      { who: actor ?? 'Reviewer', text: 'reviews again' },
    ],
    'replied-waiting': ({ primary }) => [
      { who: 'Maintainers', text: `reply on #${primary.number}` },
      { who: 'Anyone', text: `open a PR that closes #${primary.number}` },
    ],
    'commented': ({ primary }) => [
      { who: 'You', text: `reply on #${primary.number}, or leave it` },
    ],
  }

function derive(t: TFunc, s: Scenario, nowMs: number): Contribution {
  const items = new Map(s.items.map(item => [item.key, item]))
  const ctx: Ctx = { s, items }
  const primaryRaw = items.get(s.primary)!
  const at = (h: number) => nowMs - h * HOUR
  const events = [...s.events].sort((a, b) => b.h - a.h)

  const absorbed = new Set(events.filter(e => e.kind === 'closed' && e.closer).map(e => e.id))
  const blocks: Block[] = []
  let fold: { lines: Line[]; events: RawEvent[] } | null = null
  const flush = () => {
    if (!fold) return
    const [only] = fold.lines
    if (fold.lines.length === 1 && only) blocks.push({ type: 'line', id: only.id, line: only })
    else
      blocks.push({
        type: 'fold',
        id: `fold-${fold.lines[0]!.id}`,
        lines: fold.lines,
        summary: foldSummary(fold.lines, fold.events),
      })
    fold = null
  }

  for (const e of events) {
    if (absorbed.has(e.id)) continue
    const item = items.get(e.item)!
    const rule = keyRule(e, ctx)
    const { verb, chips, tone } = verbOf(e, ctx)
    const joins =
      e.kind === 'merged'
        ? events.filter(o => o.kind === 'closed' && o.closer === e.item).map(o => o.item)
        : []
    const fork = e.kind === 'opened' ? (item.closes ?? []) : []
    const line: Line = {
      id: e.id,
      at: at(e.h),
      item: e.item,
      key: rule.key,
      actor: who(e.actor, s.viewer),
      verb,
      chips: e.kind === 'merged' ? joins.map(key => `closes ${num(ctx, key)}`) : chips,
      quote: e.kind === 'comment' || e.kind === 'review' ? excerpt(e.body) : null,
      tags: rule.tags,
      tone,
      source: sourceOf(e, ctx, rule.why),
      start: e.kind === 'opened',
      fork,
      joins,
      end: e.kind === 'merged' ? 'merged' : e.kind === 'closed' ? 'closed' : null,
    }
    if (rule.key) {
      flush()
      blocks.push({ type: 'line', id: line.id, line })
    } else {
      fold ??= { lines: [], events: [] }
      fold.lines.push(line)
      fold.events.push(e)
    }
  }
  flush()

  const reasonEvent = s.events.find(e => e.id === s.reason.event)!
  const viewOf = (item: RawItem): ItemView => ({
    key: item.key,
    kind: item.kind,
    number: item.number,
    title: item.title,
    state: item.state,
    author: item.author,
    mine: item.author === s.viewer,
    primary: item.key === s.primary,
    relation: relationOf(s, item, primaryRaw),
  })

  return {
    id: s.id,
    tab: s.tab,
    archetype: s.archetype,
    repo: s.repo,
    category: CATEGORY[s.category],
    primary: viewOf(primaryRaw),
    items: s.items.map(viewOf),
    mentions: s.items.flatMap(item =>
      (item.mentions ?? []).filter(n => !s.items.some(i => i.number === n)),
    ),
    blocks,
    turn: s.turn,
    now: {
      text: reasonText(t, s.reason.code, s.reason.actor),
      at: at(reasonEvent.h),
      days: Math.floor(reasonEvent.h / 24),
      source: `judge → ${s.reason.code} · reasonText()`,
    },
    next: NEXT[s.reason.code]?.({ primary: primaryRaw, actor: s.reason.actor }) ?? [],
    notes: s.notes.map(note => ({ at: at(note.h), text: note.text })),
  }
}

export function demoContributions(t: TFunc, nowMs: number): Contribution[] {
  return SCENARIOS.map(s => derive(t, s, nowMs))
}

export function shortAgo(at: number, nowMs: number): string {
  const hours = (nowMs - at) / HOUR
  if (hours < 1) return 'now'
  if (hours < 24) return `${Math.floor(hours)}h`
  return `${Math.floor(hours / 24)}d`
}

/* Graph layout. Lanes depend only on key lines (opened, closed, merged), so
 * folding never changes the branch structure. */

export type Row =
  | { type: 'line'; id: string; line: Line; minor: boolean }
  | { type: 'fold'; id: string; fold: Extract<Block, { type: 'fold' }>; open: boolean }
  | { type: 'now'; id: 'now' }
  | { type: 'next'; id: string; next: Next; last: boolean }

export type Node = 'dot' | 'closed' | 'merged' | 'join' | 'fold' | 'now' | 'next' | null

export type Cell = {
  up: boolean
  down: boolean
  node: Node
  hl: boolean
  hr: boolean
  dashed: boolean
  mine: boolean
}

export function rowsOf(c: Contribution, open: ReadonlySet<string>): Row[] {
  const rows: Row[] = []
  for (const block of c.blocks) {
    if (block.type === 'line') {
      rows.push({ type: 'line', id: block.id, line: block.line, minor: !block.line.key })
      continue
    }
    const isOpen = open.has(block.id)
    rows.push({ type: 'fold', id: block.id, fold: block, open: isOpen })
    if (isOpen)
      for (const line of block.lines) rows.push({ type: 'line', id: line.id, line, minor: true })
  }
  if (c.turn !== 'done') rows.push({ type: 'now', id: 'now' })
  c.next.forEach((next, index) =>
    rows.push({ type: 'next', id: `next-${index}`, next, last: index === c.next.length - 1 }),
  )
  return rows
}

export function lanesOf(c: Contribution): ItemView[][] {
  const lanes: ItemView[][] = []
  const busy: (string | null)[] = []
  const lines = c.blocks.flatMap(block => (block.type === 'line' ? [block.line] : block.lines))
  for (const line of lines) {
    const item = c.items.find(i => i.key === line.item)!
    if (line.start) {
      let lane = busy.indexOf(null)
      if (lane < 0) {
        lane = busy.length
        busy.push(null)
        lanes.push([])
      }
      busy[lane] = item.key
      lanes[lane]!.push(item)
    }
    for (const key of [line.end ? line.item : null, ...line.joins]) {
      const lane = key ? busy.indexOf(key) : -1
      if (lane >= 0) busy[lane] = null
    }
  }
  return lanes
}

export function gridOf(c: Contribution, rows: Row[], lanes: ItemView[][]): Cell[][] {
  const nowAt = rows.findIndex(row => row.type === 'now')
  const nowRow = nowAt < 0 ? rows.length - 1 : nowAt
  const lastRow = rows.length - 1
  const spans = new Map<string, { start: number; end: number }>()
  for (const item of c.items) {
    const start = rows.findIndex(
      row => row.type === 'line' && row.line.item === item.key && row.line.start,
    )
    const endRow = rows.findIndex(
      row =>
        row.type === 'line' &&
        ((row.line.item === item.key && row.line.end) || row.line.joins.includes(item.key)),
    )
    spans.set(item.key, { start, end: endRow >= 0 ? endRow : item.primary ? lastRow : nowRow })
  }
  const laneOfAt = (key: string) => lanes.findIndex(lane => lane.some(item => item.key === key))

  return rows.map((row, r) => {
    const cells = lanes.map((lane): Cell => {
      const item = lane.find(i => {
        const span = spans.get(i.key)!
        return r >= span.start && r <= span.end
      })
      const blank: Cell = {
        up: false,
        down: false,
        node: null,
        hl: false,
        hr: false,
        dashed: false,
        mine: true,
      }
      if (!item) return blank
      const span = spans.get(item.key)!
      const cell: Cell = {
        ...blank,
        up: r > span.start,
        down: r < span.end,
        dashed: r > nowRow,
        mine: item.mine,
      }
      if (row.type === 'line' && row.line.item === item.key)
        cell.node =
          row.line.end === 'closed' ? 'closed' : row.line.end === 'merged' ? 'merged' : 'dot'
      if (row.type === 'line' && row.line.joins.includes(item.key)) cell.node = 'join'
      if (row.type === 'fold' && row.fold.lines.some(line => line.item === item.key))
        cell.node = 'fold'
      if (row.type === 'now' && item.primary) cell.node = 'now'
      if (row.type === 'next' && item.primary) cell.node = 'next'
      return cell
    })
    if (row.type === 'line') {
      const from = laneOfAt(row.line.item)
      const targets = [...row.line.fork, ...row.line.joins]
      for (const target of targets) {
        const to = laneOfAt(target)
        if (to < 0 || to === from) continue
        const lo = Math.min(from, to)
        const hi = Math.max(from, to)
        for (let l = lo; l <= hi; l += 1) {
          if (l > lo) cells[l]!.hl = true
          if (l < hi) cells[l]!.hr = true
        }
      }
    }
    return cells
  })
}

export function spineOf(c: Contribution, rows: Row[]): Cell[][] {
  const nowAt = rows.findIndex(row => row.type === 'now')
  const nowRow = nowAt < 0 ? rows.length - 1 : nowAt
  return rows.map((row, r) => {
    const item = row.type === 'line' ? c.items.find(i => i.key === row.line.item) : undefined
    let node: Node = 'dot'
    if (row.type === 'line' && row.line.end) node = row.line.end
    if (row.type === 'fold') node = 'fold'
    if (row.type === 'now') node = 'now'
    if (row.type === 'next') node = 'next'
    return [
      {
        up: r > 0,
        down: r < rows.length - 1,
        node,
        hl: false,
        hr: false,
        dashed: r > nowRow,
        mine: item?.mine ?? true,
      },
    ]
  })
}
