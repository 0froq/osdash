import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { expandMissingLinkedPulls } from './timeline'
import { buildUnitDrafts } from './units'
import type { Actor, Item } from './turn'

const VIEWER = 'octo-dev'

function user(login: string): Actor {
  return { typename: 'User', login }
}

function item(kind: 'pr' | 'issue', number: number, overrides: Partial<Item> = {}): Item {
  const path = kind === 'pr' ? 'pull' : 'issues'
  return {
    kind,
    repo: 'acme/app',
    number,
    title: `${kind} ${number}`,
    url: `https://github.com/acme/app/${path}/${number}`,
    state: 'open',
    createdAt: '2026-10-01T00:00:00.000Z',
    closedAt: null,
    author: user(VIEWER),
    activities: [],
    checks: [],
    viewerLogin: VIEWER,
    ...overrides,
  }
}

it('groups a viewer pull request with its closing issue', () => {
  const issue = item('issue', 4, { author: user('pi0') })
  const pull = item('pr', 12, {
    closingIssues: [
      {
        repo: issue.repo,
        number: issue.number,
        url: issue.url,
        state: 'open',
        title: issue.title,
        authorLogin: 'pi0',
      },
    ],
  })
  const drafts = buildUnitDrafts([issue, pull])
  assert.equal(drafts.length, 1)
  assert.equal(drafts[0]?.kind, 'pr')
  assert.equal(drafts[0]?.primary.number, 12)
  assert.equal(drafts[0]?.issues.length, 1)
  assert.equal(drafts[0]?.issues[0]?.link, 'closing')
  assert.equal(drafts[0]?.issues[0]?.number, 4)
})

it('marks a viewer pull request with no issue as a direct PR', () => {
  const drafts = buildUnitDrafts([item('pr', 12)])
  assert.equal(drafts.length, 1)
  assert.equal(drafts[0]?.category, 'direct-pr')
  assert.equal(drafts[0]?.issues.length, 0)
})

it('keeps a claimed issue without a pull request as a dashed card', () => {
  const claimed = item('issue', 4, {
    author: user('pi0'),
    activities: [
      {
        kind: 'comment',
        at: '2026-10-02T00:00:00.000Z',
        actor: user(VIEWER),
        body: "I'll open a PR",
      },
    ],
  })
  const reported = item('issue', 8, { author: user(VIEWER) })
  const drafts = buildUnitDrafts([claimed, reported])
  assert.equal(drafts.length, 2)
  const helped = drafts.find(draft => draft.primary.number === 4)
  const own = drafts.find(draft => draft.primary.number === 8)
  assert.equal(helped?.kind, 'issue-only')
  assert.equal(helped?.category, 'helped')
  assert.equal(own?.kind, 'issue-only')
  assert.equal(own?.category, 'reported')
})

it('folds a closed unmerged pull request into the one opened within a day', () => {
  const issue = item('issue', 4, { author: user('pi0') })
  const closing = {
    repo: issue.repo,
    number: issue.number,
    url: issue.url,
    state: 'open' as const,
    title: issue.title,
    authorLogin: 'pi0',
  }
  const first = item('pr', 1, {
    state: 'closed',
    createdAt: '2026-10-01T00:00:00.000Z',
    closedAt: '2026-10-02T00:00:00.000Z',
    closingIssues: [closing],
  })
  const second = item('pr', 2, {
    createdAt: '2026-10-02T01:00:00.000Z',
    closingIssues: [closing],
  })
  const drafts = buildUnitDrafts([issue, first, second])
  assert.equal(drafts.length, 1)
  assert.equal(drafts[0]?.primary.number, 2)
  assert.equal(drafts[0]?.history.length, 1)
  assert.equal(drafts[0]?.history[0]?.number, 1)
  assert.equal(drafts[0]?.history[0]?.state, 'closed')
})

it('splits two open pull requests and records the other on each issue', () => {
  const issue = item('issue', 4, { author: user('pi0') })
  const closing = {
    repo: issue.repo,
    number: issue.number,
    url: issue.url,
    state: 'open' as const,
    title: issue.title,
    authorLogin: 'pi0',
  }
  const first = item('pr', 1, { closingIssues: [closing] })
  const second = item('pr', 2, { closingIssues: [closing] })
  const drafts = buildUnitDrafts([issue, first, second])
  assert.equal(drafts.length, 2)
  const card1 = drafts.find(draft => draft.primary.number === 1)
  const card2 = drafts.find(draft => draft.primary.number === 2)
  assert.deepEqual(card1?.issues[0]?.sharedWith, [
    { repo: 'acme/app', number: 2, url: 'https://github.com/acme/app/pull/2' },
  ])
  assert.deepEqual(card2?.issues[0]?.sharedWith, [
    { repo: 'acme/app', number: 1, url: 'https://github.com/acme/app/pull/1' },
  ])
})

it('records someone else\u2019s fixing pull request without making it a card', () => {
  const issue = item('issue', 4, {
    linkedPullRequests: [
      {
        repo: 'acme/app',
        number: 50,
        url: 'https://github.com/acme/app/pull/50',
        state: 'merged',
        author: user('other'),
      },
    ],
  })
  const other = item('pr', 50, {
    author: user('other'),
    state: 'merged',
    closedAt: '2026-10-03T00:00:00.000Z',
  })
  const drafts = buildUnitDrafts([issue, other])
  assert.equal(drafts.length, 1)
  assert.equal(drafts[0]?.kind, 'issue-only')
  assert.equal(drafts[0]?.fixedBy?.number, 50)
  assert.equal(drafts[0]?.fixedBy?.authorLogin, 'other')
  assert.equal(drafts[0]?.fixedBy?.state, 'merged')
})

it('does not turn a timeline ghost stub into a card', () => {
  const issue = item('issue', 4, {
    timelineLinks: [{ event: 'cross-referenced', repo: 'acme/app', number: 99, kind: 'pr' }],
  })
  const expanded = expandMissingLinkedPulls([issue])
  assert.equal(expanded.length, 2)
  const drafts = buildUnitDrafts(expanded)
  assert.equal(drafts.length, 1)
  assert.equal(drafts[0]?.kind, 'issue-only')
  assert.equal(drafts[0]?.primary.number, 4)
})

it('keeps two issues on one pull request card', () => {
  const first = item('issue', 4, { author: user('pi0') })
  const second = item('issue', 5, { author: user('pi0') })
  const pull = item('pr', 12, {
    closingIssues: [first, second].map(issue => ({
      repo: issue.repo,
      number: issue.number,
      url: issue.url,
      state: 'open' as const,
      title: issue.title,
      authorLogin: 'pi0',
    })),
  })
  const drafts = buildUnitDrafts([first, second, pull])
  assert.equal(drafts.length, 1)
  assert.deepEqual(
    drafts[0]?.issues.map(issue => issue.number).sort((left, right) => left - right),
    [4, 5],
  )
})
