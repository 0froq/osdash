/**
 * Demo of a "story" model: the linked items of one contribution, the steps
 * that matter, and what comes next. Every renderer (web, CLI, extension,
 * agent) would read this same shape.
 */

export type ItemState = 'open' | 'closed' | 'merged'

export type StoryItem = {
  key: string
  kind: 'issue' | 'pr'
  number: number
  title: string
  state: ItemState
  author: string
  /** current: your PR. earlier: your replaced PR. context: an issue. other: someone else's PR. */
  role: 'current' | 'earlier' | 'context' | 'other'
  relation: string
}

export type StepKind =
  | 'opened'
  | 'comment'
  | 'changes'
  | 'approved'
  | 'pushed'
  | 'closed'
  | 'merged'
  | 'linked'
  | 'note'

export type Step = {
  id: string
  at: string
  item: string
  kind: StepKind
  actor: string
  text: string
  quote?: string
  machine?: string
  machineTone?: 'bad'
  links?: Array<{ to: string; label: string }>
}

export type Turn = 'you' | 'them' | 'done'

export type Story = {
  id: string
  tab: string
  repo: string
  current: string
  turn: Turn
  now: string
  nowAt: string
  askId: string | null
  items: StoryItem[]
  steps: Step[]
  next: Array<{ item: string; actor: string; text: string }>
  repoNotes: Array<{ at: string; text: string }>
}

export function itemOf(story: Story, key: string): StoryItem {
  return story.items.find(item => item.key === key)!
}

export function currentItem(story: Story): StoryItem {
  return itemOf(story, story.current)
}

export function itemUrl(story: Story, item: StoryItem): string {
  return `https://github.com/${story.repo}/${item.kind === 'pr' ? 'pull' : 'issues'}/${item.number}`
}

/** `now`, `5h`, `3d`. Short enough for a phone row. */
export function ago(iso: string, nowMs: number): string {
  const hours = (nowMs - Date.parse(iso)) / 3_600_000
  if (hours < 1) return 'now'
  if (hours < 24) return `${Math.floor(hours)}h`
  return `${Math.floor(hours / 24)}d`
}

export function stepRef(story: Story, step: { item: string }): string | null {
  if (step.item === story.current) return null
  return `#${itemOf(story, step.item).number}`
}

function clock(nowMs: number) {
  return (hours: number) => new Date(nowMs - hours * 3_600_000).toISOString()
}

function vite(nowMs: number): Story {
  const at = clock(nowMs)
  return {
    id: 'vite',
    tab: '进行中 · 两个 PR 两个 issue',
    repo: 'vitejs/vite',
    current: 'p2',
    turn: 'you',
    now: 'patak asked for changes',
    nowAt: at(30),
    askId: 's9',
    items: [
      {
        key: 'i1',
        kind: 'issue',
        number: 18790,
        title: 'Optional peer deps get promoted to hard deps',
        state: 'open',
        author: 'kricsleo',
        role: 'context',
        relation: 'Fixed by #18820',
      },
      {
        key: 'p1',
        kind: 'pr',
        number: 18801,
        title: 'fix: skip optional peers in the optimizer',
        state: 'closed',
        author: 'you',
        role: 'earlier',
        relation: 'Replaced by #18820',
      },
      {
        key: 'p2',
        kind: 'pr',
        number: 18820,
        title: 'fix: do not promote optional peers',
        state: 'open',
        author: 'you',
        role: 'current',
        relation: 'Your PR',
      },
      {
        key: 'i2',
        kind: 'issue',
        number: 18811,
        title: 'Pre-bundling breaks with pnpm and optional peers',
        state: 'open',
        author: 'sapphi-red',
        role: 'context',
        relation: 'Same root cause',
      },
    ],
    steps: [
      {
        id: 's1',
        at: at(120),
        item: 'i1',
        kind: 'opened',
        actor: 'kricsleo',
        text: 'reported the bug',
        quote: 'Optional peers end up as hard deps after pre-bundling.',
      },
      {
        id: 's2',
        at: at(110),
        item: 'i1',
        kind: 'comment',
        actor: 'you',
        text: 'offered to fix it',
        quote: "I'd like to take this.",
      },
      {
        id: 's3',
        at: at(108),
        item: 'i1',
        kind: 'comment',
        actor: 'patak',
        text: 'said go ahead',
        quote: 'Go for it.',
      },
      {
        id: 's4',
        at: at(96),
        item: 'p1',
        kind: 'opened',
        actor: 'you',
        text: 'opened a first attempt',
        machine: '3 checks passed · 2 bot notes',
        links: [{ to: 'i1', label: 'fixes' }],
      },
      {
        id: 's5',
        at: at(72),
        item: 'p1',
        kind: 'comment',
        actor: 'patak',
        text: 'asked for a smaller change',
        quote: 'This changes the optimizer for everyone. Can we keep it in the peer step?',
      },
      {
        id: 's6',
        at: at(60),
        item: 'p1',
        kind: 'closed',
        actor: 'you',
        text: 'closed it to start over',
        links: [{ to: 'p2', label: 'replaced by' }],
      },
      {
        id: 's7',
        at: at(50),
        item: 'p2',
        kind: 'opened',
        actor: 'you',
        text: 'opened the narrower fix',
        machine: 'test failed · 1 passed · 4 bot notes',
        machineTone: 'bad',
        links: [{ to: 'i1', label: 'fixes' }],
      },
      {
        id: 's8',
        at: at(40),
        item: 'i2',
        kind: 'linked',
        actor: 'sapphi-red',
        text: 'linked a second issue with the same cause',
        links: [{ to: 'p2', label: 'mentions' }],
      },
      {
        id: 's9',
        at: at(30),
        item: 'p2',
        kind: 'changes',
        actor: 'patak',
        text: 'requested changes',
        quote:
          'Can we avoid touching the resolver? A narrower fix in the optional peer step would be much easier to land.',
      },
      {
        id: 's10',
        at: at(28),
        item: 'p2',
        kind: 'note',
        actor: 'you',
        text: 'note',
        quote:
          'Resolver lives in optimizer/resolve.ts. Move the check into the peer step and leave resolve alone.',
      },
    ],
    next: [
      { item: 'p2', actor: 'you', text: 'Push a narrower fix' },
      { item: 'p2', actor: 'patak', text: 'Reviews again' },
      { item: 'i1', actor: 'patak', text: 'Merging closes #18790' },
    ],
    repoNotes: [
      { at: at(28), text: 'patak prefers small, local fixes over shared helpers.' },
      { at: at(24 * 30), text: 'pnpm test-serve -- optimizer runs the slow suite.' },
    ],
  }
}

function h3(nowMs: number): Story {
  const at = clock(nowMs)
  return {
    id: 'h3',
    tab: '只有 issue · 别人修好了',
    repo: 'unjs/h3',
    current: 'i1',
    turn: 'done',
    now: 'Fixed by pi0 in #901',
    nowAt: at(10),
    askId: null,
    items: [
      {
        key: 'i1',
        kind: 'issue',
        number: 880,
        title: 'event.context leaks across parallel requests',
        state: 'closed',
        author: 'you',
        role: 'current',
        relation: 'You reported it',
      },
      {
        key: 'p1',
        kind: 'pr',
        number: 901,
        title: 'fix: isolate event context per request',
        state: 'merged',
        author: 'pi0',
        role: 'other',
        relation: 'pi0 fixed it',
      },
    ],
    steps: [
      {
        id: 's1',
        at: at(72),
        item: 'i1',
        kind: 'opened',
        actor: 'you',
        text: 'reported it with a repro',
      },
      {
        id: 's2',
        at: at(60),
        item: 'i1',
        kind: 'comment',
        actor: 'pi0',
        text: 'confirmed it',
        quote: 'Confirmed. The context object is reused. Working on it.',
      },
      {
        id: 's3',
        at: at(48),
        item: 'i1',
        kind: 'note',
        actor: 'you',
        text: 'note',
        quote: 'Workaround in my app: create the context per request until this lands.',
      },
      {
        id: 's4',
        at: at(30),
        item: 'p1',
        kind: 'opened',
        actor: 'pi0',
        text: 'opened a fix',
        machine: '4 checks passed',
        links: [{ to: 'i1', label: 'fixes' }],
      },
      {
        id: 's5',
        at: at(10),
        item: 'p1',
        kind: 'merged',
        actor: 'pi0',
        text: 'merged the fix',
        links: [{ to: 'i1', label: 'closes' }],
      },
    ],
    next: [{ item: 'i1', actor: 'you', text: 'Drop the workaround after the next release' }],
    repoNotes: [{ at: at(48), text: 'Releases go out on Fridays.' }],
  }
}

function pnpm(nowMs: number): Story {
  const at = clock(nowMs)
  return {
    id: 'pnpm',
    tab: '已合并 · 一个 PR 一个 issue',
    repo: 'pnpm/pnpm',
    current: 'p1',
    turn: 'done',
    now: 'Merged by zkochan',
    nowAt: at(48),
    askId: null,
    items: [
      {
        key: 'i1',
        kind: 'issue',
        number: 9087,
        title: 'catalog: protocol is rewritten on publish',
        state: 'closed',
        author: 'mmkal',
        role: 'context',
        relation: 'Closed by #9104',
      },
      {
        key: 'p1',
        kind: 'pr',
        number: 9104,
        title: 'fix: keep catalog protocol unchanged',
        state: 'merged',
        author: 'you',
        role: 'current',
        relation: 'Your PR',
      },
    ],
    steps: [
      {
        id: 's1',
        at: at(24 * 8),
        item: 'i1',
        kind: 'opened',
        actor: 'mmkal',
        text: 'reported the bug',
      },
      {
        id: 's2',
        at: at(24 * 6),
        item: 'p1',
        kind: 'opened',
        actor: 'you',
        text: 'opened a fix',
        machine: '1 check passed',
        links: [{ to: 'i1', label: 'fixes' }],
      },
      {
        id: 's3',
        at: at(24 * 4),
        item: 'p1',
        kind: 'changes',
        actor: 'zkochan',
        text: 'requested changes',
        quote: 'Please add a changeset.',
      },
      {
        id: 's4',
        at: at(24 * 3.5),
        item: 'p1',
        kind: 'pushed',
        actor: 'you',
        text: 'added the changeset',
        machine: '1 check passed',
      },
      {
        id: 's5',
        at: at(24 * 2.2),
        item: 'p1',
        kind: 'approved',
        actor: 'zkochan',
        text: 'approved',
      },
      {
        id: 's6',
        at: at(48),
        item: 'p1',
        kind: 'merged',
        actor: 'zkochan',
        text: 'merged it',
        links: [{ to: 'i1', label: 'closes' }],
      },
    ],
    next: [],
    repoNotes: [],
  }
}

export function demoStories(nowMs: number): Story[] {
  return [vite(nowMs), h3(nowMs), pnpm(nowMs)]
}

function ref(item: StoryItem): string {
  return `#${item.number}`
}

/** The same story as plain text, the way a CLI or an agent would print it. */
export function storyText(story: Story, day: (iso: string) => string): string {
  const current = currentItem(story)
  const lines = [
    `$ osdash show ${story.repo}#${current.number}`,
    '',
    `${story.repo} ${ref(current)}  ${current.title}`,
    `now   ${story.turn === 'you' ? 'YOUR TURN' : story.turn === 'them' ? 'WAITING' : 'DONE'}  ${story.now}`,
    '',
    'linked',
    ...story.items.map(
      item =>
        `  ${item.kind.padEnd(5)} ${ref(item).padEnd(7)} ${item.state.padEnd(6)} ${item.relation}`,
    ),
    '',
    'steps',
    ...story.steps.map(step => {
      const item = itemOf(story, step.item)
      const who = step.kind === 'note' ? 'note' : step.actor
      const what = step.kind === 'note' ? (step.quote ?? '') : step.text
      return `  ${day(step.at).padEnd(11)} ${ref(item).padEnd(7)} ${who} ${what}`
    }),
  ]
  if (story.next.length > 0) {
    lines.push('', 'next')
    for (const next of story.next) lines.push(`  ${next.actor.padEnd(8)} ${next.text}`)
  }
  return lines.join('\n')
}
