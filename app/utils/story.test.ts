import { describe, expect, it } from 'vite-plus/test'
import type { TimelineEntry, UnitEvent } from '#shared/events'
import type { StoryItem } from '#shared/story'
import { buildStory, storyGrid, storyRows, type StoryCard } from './story'

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

describe('buildStory', () => {
  const story = buildStory(entries, items, card, VIEWER)!

  it('keeps only derivable key lines visible', () => {
    const keys = story.blocks.flatMap(block =>
      block.type === 'line'
        ? [`${block.line.actor} ${block.line.verb} ${block.line.tags.join(',')}`.trim()]
        : [],
    )
    expect(keys).toEqual([
      'kris opened issue #100',
      'octo commented claim',
      'patak commented maintainer',
      'patak assigned you',
      'octo opened PR #201',
      'nao opened issue #101',
      'octo closed #201',
      'octo opened PR #220',
      'patak requested changes maintainer',
    ])
  })

  it('marks the judge reason line and lists the next steps', () => {
    const reason = story.blocks.find(block => block.type === 'line' && block.line.reason)
    expect(reason?.type === 'line' && reason.line.id).toBe('r1')
    expect(story.next.map(next => `${next.who} ${next.text}`)).toEqual([
      'You push to #220',
      'patak reviews again',
    ])
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
      [event('m', 300, 'merged', 10, 'zk'), event('ic', 30, 'closed', 10, 'zk')],
      merged,
      { ...card, ended: true, myTurn: false, reasonCode: 'merged', reasonActor: null },
      VIEWER,
    )!
    const lines = story.blocks.flatMap(block => (block.type === 'line' ? [block.line] : []))
    expect(lines.map(line => line.id)).toEqual(['opened:acme/app#30', 'opened:acme/app#300', 'm'])
    expect(lines.at(-1)!.joins).toEqual(['acme/app#30'])
    expect(story.turn).toBe('done')
    expect(storyRows(story, new Set()).some(row => row.type === 'now')).toBe(false)
  })
})
