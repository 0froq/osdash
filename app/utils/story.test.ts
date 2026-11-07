import { describe, expect, it } from 'vite-plus/test'
import type { TimelineEntry, UnitEvent } from '#shared/events'
import type { StoryItem } from '#shared/story'
import {
  buildStory,
  railStrokes,
  storyGrid,
  storyRows,
  type StoryCard,
  type StoryCell,
  type StoryRow,
} from './story'
import type { TFunc } from '#shared/i18n'
import { createI18n } from 'vue-i18n'
import en from '../../i18n/locales/en'

const t = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
}).global.t as TFunc

const NOW = Date.parse('2026-10-24T00:00:00Z')
const at = (hours: number) => new Date(NOW - hours * 3_600_000).toISOString()
const VIEWER = 'octo'

function item(
  partial: Partial<StoryItem> & Pick<StoryItem, 'kind' | 'number' | 'role'>,
): StoryItem {
  return {
    key: `acme/app#${partial.number}`,
    repo: 'acme/app',
    title: `item ${partial.number}`,
    url: `https://github.com/acme/app/${partial.kind === 'pr' ? 'pull' : 'issues'}/${partial.number}`,
    state: 'open',
    authorLogin: VIEWER,
    createdAt: null,
    closedAt: null,
    link: null,
    closes: [],
    ...partial,
  }
}

function event(
  id: string,
  number: number,
  kind: UnitEvent['kind'],
  hours: number,
  login: string,
  extra: Partial<UnitEvent> = {},
): UnitEvent {
  return {
    id,
    kind,
    at: at(hours),
    actor: { typename: login.endsWith('[bot]') ? 'Bot' : 'User', login },
    source: { repo: 'acme/app', number, kind: number >= 200 ? 'pr' : 'issue' },
    bot: login.endsWith('[bot]') ? 'noise' : null,
    ...extra,
  }
}

const items: StoryItem[] = [
  item({
    kind: 'pr',
    number: 220,
    role: 'primary',
    createdAt: at(170),
    closes: ['acme/app#100', 'acme/app#101'],
    closingEvidence: 'explicit',
  }),
  item({
    kind: 'issue',
    number: 100,
    role: 'issue',
    link: 'closing',
    authorLogin: 'kris',
    createdAt: at(290),
  }),
  item({
    kind: 'issue',
    number: 101,
    role: 'issue',
    link: 'closing',
    authorLogin: 'nao',
    createdAt: at(216),
  }),
  item({
    kind: 'issue',
    number: 133,
    role: 'issue',
    link: 'mention',
    authorLogin: 'nao',
    createdAt: at(400),
  }),
  item({
    kind: 'pr',
    number: 201,
    role: 'history',
    state: 'closed',
    createdAt: at(240),
    closedAt: at(171),
    closes: ['acme/app#100'],
  }),
]

const entries: TimelineEntry[] = [
  event('c1', 100, 'comment', 266, VIEWER, { claim: true, excerpt: 'I can take this one.' }),
  event('c2', 100, 'comment', 262, 'patak', { association: 'MEMBER', excerpt: 'Go for it.' }),
  event('a1', 100, 'assigned', 262, 'patak', { targetLogin: VIEWER }),
  event('k1', 201, 'commit', 239, VIEWER),
  event('b1', 201, 'comment', 239, 'coderabbitai[bot]'),
  event('x1', 201, 'closed', 171, VIEWER),
  event('k2', 220, 'commit', 169, VIEWER),
  event('l1', 220, 'labeled', 168, 'patak', { label: { name: 'bug', color: 'fff' } }),
  event('r1', 220, 'review', 26, 'patak', {
    association: 'MEMBER',
    reviewState: 'CHANGES_REQUESTED',
    excerpt: 'Please add a test.',
    url: 'https://github.com/acme/app/pull/220#pullrequestreview-1',
  }),
]

const card: StoryCard = {
  kind: 'pr',
  category: 'claimed-fix',
  ended: false,
  myTurn: true,
  reasonCode: 'changes-requested',
  reasonActor: 'patak',
  links: { comment: null },
}

it('carries full Markdown into story lines without replacing plain summaries', () => {
  const body = '<details><summary>Report</summary><p>**Full body**</p></details>'
  const story = buildStory(
    t,
    [event('markdown', 220, 'comment', 1, VIEWER, { body, excerpt: 'Report Full body' })],
    items,
    card,
    VIEWER,
  )!
  const line = story.blocks
    .flatMap(block => (block.type === 'line' ? [block.line] : block.fold.lines))
    .find(entry => entry.id === 'markdown')
  expect(line?.body).toBe(body)
  expect(line?.quote).toBe('Report Full body')
})

describe('buildStory', () => {
  const story = buildStory(t, entries, items, card, VIEWER)!

  it('keeps only derivable key lines visible', () => {
    const keys = story.blocks.flatMap(block =>
      block.type === 'line'
        ? [`${block.line.actor} ${block.line.verb} ${block.line.tags.join(',')}`.trim()]
        : [],
    )
    expect(keys).toEqual([
      'kris opened issue #100',
      'octo commented',
      'patak commented maintainer',
      'patak assigned you',
      'octo opened PR #201',
      'octo pushed a commit',
      'coderabbitai[bot] commented',
      'nao opened issue #101',
      'octo closed #201',
      'octo opened PR #220',
      'patak requested changes maintainer',
    ])
  })

  it('marks the reason and ends with now and an unknown future, without predictions', () => {
    const reason = story.blocks.find(block => block.type === 'line' && block.line.reason)
    expect(reason?.type === 'line' && reason.line.id).toBe('r1')
    const rows = storyRows(story, new Set())
    expect(rows.slice(-2)).toEqual([
      { type: 'now', id: 'now' },
      { type: 'future', id: 'future' },
    ])
    expect(rows.every(row => ['line', 'fold', 'now', 'future'].includes(row.type))).toBe(true)
  })

  it('continues open issue and PR rails into a conditional convergence without event nodes', () => {
    expect(story.tail.converge).toEqual(['acme/app#220', 'acme/app#100', 'acme/app#101'])
    const rows = storyRows(story, new Set())
    const grid = storyGrid(story, rows, VIEWER, false)
    const tail = grid.at(-1)!
    expect(tail.every(cell => cell.node === null && !cell.down)).toBe(true)
    expect(tail.filter(cell => cell.up)).toHaveLength(3)
    expect(tail.every(cell => cell.dashed && cell.projected)).toBe(true)
    expect(tail.some(cell => cell.hl || cell.hr)).toBe(true)
    expect(grid.at(-2)!.some(cell => cell.node === 'now')).toBe(true)
  })

  it('keeps mention-only issues off the rails', () => {
    expect(story.rails.map(rail => rail.number).sort()).toEqual([100, 101, 201, 220])
    expect(story.related.map(item => item.number)).toEqual([133])
  })

  it('reuses the column freed by the closed PR', () => {
    expect(story.lanes.map(lane => lane.map(item => item.number))).toEqual([
      [100],
      [201, 220],
      [101],
    ])
  })

  it('folds without changing the branches', () => {
    const folds = new Set(
      story.blocks.flatMap(block => (block.type === 'fold' ? [block.fold.id] : [])),
    )
    expect(folds.size).toBeGreaterThan(0)
    const signature = (open: Set<string>) => {
      const rows = storyRows(story, open)
      const grid = storyGrid(story, rows, VIEWER, false)
      return rows.flatMap((row, index) =>
        row.type === 'line' && row.minor
          ? []
          : row.type === 'fold'
            ? []
            : [
                grid[index]!.map(
                  cell => `${+cell.up}${+cell.down}${cell.node}${+cell.hl}${+cell.hr}`,
                ).join(' '),
              ],
      )
    }
    expect(signature(new Set())).toEqual(signature(folds))
  })
})

describe('current state and conditional tails', () => {
  const primary = () =>
    item({
      kind: 'pr',
      number: 220,
      role: 'primary',
      createdAt: at(40),
      closes: ['acme/app#100'],
      closingEvidence: 'explicit',
    })
  const issue = () =>
    item({
      kind: 'issue',
      number: 100,
      role: 'issue',
      link: 'closing',
      createdAt: at(60),
    })
  const draw = (members: StoryItem[], events: TimelineEntry[] = [], current = card) => {
    const story = buildStory(t, events, members, current, VIEWER)!
    const rows = storyRows(story, new Set())
    return { story, rows, grid: storyGrid(story, rows, VIEWER, story.rails.length <= 1) }
  }

  it.each(['issue', 'pr'] as const)('ends a standalone %s with a short, node-free tail', kind => {
    const { story, grid } = draw([item({ kind, number: 220, role: 'primary', createdAt: at(40) })])
    expect(story.tail).toEqual({ open: ['acme/app#220'], converge: [] })
    expect(grid.at(-1)).toEqual([
      expect.objectContaining({
        up: true,
        down: false,
        dashed: true,
        projected: false,
        node: null,
      }),
    ])
  })

  it('places now on the open issue that supplied the reason, without moving its events', () => {
    const url = 'https://github.com/acme/app/issues/100#issuecomment-1'
    const { story, rows, grid } = draw(
      [primary(), issue()],
      [event('ask', 100, 'comment', 10, 'patak', { url, excerpt: 'Please update the repro.' })],
      { ...card, reasonCode: 'mentioned', reasonActor: 'patak', links: { comment: url } },
    )
    expect(story.nowItem).toBe('acme/app#220')
    const lane = story.lanes.findIndex(items => items.some(item => item.key === story.nowItem))
    const now = grid[rows.findIndex(row => row.type === 'now')]!
    expect(now[lane]!.node).toBe('now')
    expect(now.filter(cell => cell.node === 'now')).toHaveLength(1)
    expect(now.filter(cell => cell.down)).toHaveLength(2)
    const reason = rows.find(row => row.type === 'line' && row.line.id === 'ask')
    expect(reason?.type === 'line' && reason.line.item).toBe('acme/app#100')
  })

  it('falls back to the primary when the reason event is unavailable', () => {
    expect(draw([primary(), issue()]).story.nowItem).toBe('acme/app#220')
  })

  it('does not put now on a closed issue even when its comment supplied the reason', () => {
    const url = 'https://github.com/acme/app/issues/100#issuecomment-1'
    const { story } = draw(
      [primary(), { ...issue(), state: 'closed' }],
      [
        event('ask', 100, 'comment', 20, 'patak', { url }),
        event('closed', 100, 'closed', 10, VIEWER),
      ],
      { ...card, reasonCode: 'mentioned', links: { comment: url } },
    )
    expect(story.nowItem).toBe('acme/app#220')
    expect(story.tail.open).not.toContain('acme/app#100')
  })

  it.each([undefined, 'inferred'] as const)(
    'does not converge without explicit evidence (%s)',
    evidence => {
      const { story, grid } = draw([{ ...primary(), closingEvidence: evidence }, issue()])
      expect(story.tail.open).toHaveLength(2)
      expect(story.tail.converge).toEqual([])
      expect(grid.at(-1)!.every(cell => !cell.hl && !cell.hr && !cell.projected)).toBe(true)
    },
  )

  it('converges only open, explicitly targeted issues and leaves closed or mentioned items out', () => {
    const { story, grid } = draw([
      { ...primary(), closes: ['acme/app#100', 'acme/app#101', 'acme/app#102'] },
      issue(),
      item({
        kind: 'issue',
        number: 101,
        role: 'issue',
        link: 'closing',
        state: 'closed',
        createdAt: at(70),
      }),
      item({ kind: 'issue', number: 102, role: 'issue', link: 'mention', createdAt: at(80) }),
    ])
    expect(story.tail).toEqual({
      open: ['acme/app#220', 'acme/app#100'],
      converge: ['acme/app#220', 'acme/app#100'],
    })
    expect(grid.at(-1)!.filter(cell => cell.up)).toHaveLength(2)
    expect(grid.at(-1)!.every(cell => cell.node === null && !cell.down)).toBe(true)
  })

  it('bridges over alternative PRs without combining them into the primary closing path', () => {
    const { story, grid } = draw([
      primary(),
      issue(),
      item({
        kind: 'pr',
        number: 301,
        role: 'fixed-by',
        createdAt: at(50),
        closes: ['acme/app#100'],
        closingEvidence: 'explicit',
      }),
    ])
    expect(story.tail.open).toContain('acme/app#301')
    expect(story.tail.converge).toEqual(['acme/app#220', 'acme/app#100'])
    const alternative = story.lanes.findIndex(lane => lane.some(item => item.number === 301))
    expect(grid.at(-1)![alternative]).toMatchObject({
      up: true,
      down: true,
      cross: true,
      node: null,
    })
  })

  it('does not convert an issue-only card into a projected fix by another PR', () => {
    const { story } = draw(
      [
        { ...issue(), role: 'primary' },
        item({
          kind: 'pr',
          number: 301,
          role: 'fixed-by',
          createdAt: at(30),
          closes: ['acme/app#100'],
          closingEvidence: 'inferred',
        }),
      ],
      [],
      { ...card, kind: 'issue-only' },
    )
    expect(story.tail.converge).toEqual([])
  })

  it('stops a closed primary even if a linked issue remains open', () => {
    const { story, rows } = draw(
      [{ ...primary(), state: 'closed' }, issue()],
      [event('closed', 220, 'closed', 10, VIEWER)],
      { ...card, ended: true, reasonCode: 'closed' },
    )
    expect(story.tail).toEqual({ open: [], converge: [] })
    expect(rows.every(row => row.type !== 'now' && row.type !== 'future')).toBe(true)
  })
})

describe('merges', () => {
  it('closes the issue on the merge line', () => {
    const merged: StoryItem[] = [
      item({
        kind: 'pr',
        number: 300,
        role: 'primary',
        state: 'merged',
        createdAt: at(50),
        closes: ['acme/app#30'],
      }),
      item({
        kind: 'issue',
        number: 30,
        role: 'issue',
        link: 'closing',
        state: 'closed',
        createdAt: at(60),
      }),
    ]
    const story = buildStory(
      t,
      [event('m', 300, 'merged', 10, 'zk'), event('ic', 30, 'closed', 10, 'zk')],
      merged,
      { ...card, ended: true, myTurn: false, reasonCode: 'merged', reasonActor: null },
      VIEWER,
    )!
    const lines = story.blocks.flatMap(block => (block.type === 'line' ? [block.line] : []))
    expect(lines.map(line => line.id)).toEqual(['opened:acme/app#30', 'opened:acme/app#300', 'm'])
    expect(lines.at(-1)!.joins).toEqual(['acme/app#30'])
    expect(story.turn).toBe('done')
    expect(
      storyRows(story, new Set()).some(row => row.type === 'now' || row.type === 'future'),
    ).toBe(false)
  })
})

function strokeCell(partial: Partial<StoryCell> & Pick<StoryCell, 'lane'>): StoryCell {
  return {
    up: false,
    down: false,
    node: null,
    hl: false,
    hr: false,
    cross: false,
    link: null,
    dashed: false,
    mine: true,
    primary: false,
    fade: false,
    projected: false,
    ...partial,
  }
}

describe('rail strokes', () => {
  const rows = [
    { type: 'line', minor: false },
    { type: 'line', minor: true },
    { type: 'now' },
    { type: 'future' },
  ] as StoryRow[]

  it('keeps one colour along a lane and starts the dashed tail at Now', () => {
    const on = (lane: number, extra: Partial<StoryCell> = {}) =>
      strokeCell({ lane, up: true, down: true, ...extra })
    const strokes = railStrokes(rows, [
      [on(0, { up: false, node: 'open' }), on(1, { up: false, mine: false, node: 'open' })],
      [on(0, { node: 'dot', mine: false }), strokeCell({ lane: 1 })],
      [on(0, { node: 'now' }), strokeCell({ lane: 1 })],
      [on(0, { dashed: true }), strokeCell({ lane: 1 })],
    ])
    const lane0 = strokes.filter(stroke => stroke.lane === 0)
    expect(lane0.map(stroke => stroke.dashed)).toEqual([false, true])
    expect(lane0.every(stroke => stroke.mine)).toBe(true)
    expect(lane0[0]).toMatchObject({ end: 'extend', y0: '14px', y1: '19px' })
    expect(lane0[1]).toMatchObject({ end: 'bottom', y0: '19px', shift: '10px', tail: true })
    expect(strokes.filter(stroke => stroke.lane === 1)).toEqual([
      expect.objectContaining({ mine: false, dashed: false, end: 'bottom', y0: '14px' }),
    ])
  })

  it('stops a rail at its last node instead of running to the row bottom', () => {
    const [stroke] = railStrokes(
      [
        { type: 'line', minor: false },
        { type: 'line', minor: false },
      ] as StoryRow[],
      [
        [strokeCell({ lane: 0, up: false, down: true, node: 'open' })],
        [strokeCell({ lane: 0, up: true, down: false, node: 'merged' })],
      ],
    )
    expect(stroke).toMatchObject({ end: 'extend', y0: '14px', y1: '14px', dashed: false })
  })
})
