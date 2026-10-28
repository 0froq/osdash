import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { expandMissingLinkedPulls } from './timeline'
import { buildUnitDrafts, recentBeats, toUnit } from './units'
import { judge, type Actor, type Item } from './turn'

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
    closingIssues: [{ ...issue, authorLogin: issue.author.login }],
  })
  const drafts = buildUnitDrafts([issue, other])
  assert.equal(drafts.length, 1)
  assert.equal(drafts[0]?.kind, 'issue-only')
  assert.equal(drafts[0]?.fixedBy?.number, 50)
  assert.equal(drafts[0]?.fixedBy?.authorLogin, 'other')
  assert.equal(drafts[0]?.fixedBy?.state, 'merged')
})

it('records a merged pull request by someone else on the viewer pull request card', () => {
  const issue = item('issue', 4, {
    author: user('pi0'),
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
  const closing = {
    repo: issue.repo,
    number: issue.number,
    url: issue.url,
    state: 'closed' as const,
    title: issue.title,
    authorLogin: 'pi0',
  }
  const mine = item('pr', 12, { state: 'closed', closingIssues: [closing] })
  const other = item('pr', 50, {
    author: user('other'),
    state: 'merged',
    createdAt: '2026-10-02T00:00:00.000Z',
    closingIssues: [closing],
  })
  const drafts = buildUnitDrafts([issue, mine, other])
  assert.equal(drafts.length, 1)
  assert.equal(drafts[0]?.primary.number, 12)
  assert.equal(drafts[0]?.fixedBy?.number, 50)
  assert.equal(drafts[0]?.fixedBy?.createdAt, '2026-10-02T00:00:00.000Z')
})

it('does not mistake a downstream workaround for an upstream fix', () => {
  const issue = item('issue', 1329, {
    repo: 'shikijs/shiki',
    author: user('hawk90'),
    timelineLinks: [
      { event: 'cross-referenced', repo: 'PhyberApex/lightning-talks', number: 942, kind: 'pr' },
    ],
    linkedPullRequests: [
      {
        repo: 'PhyberApex/lightning-talks',
        number: 942,
        url: 'https://github.com/PhyberApex/lightning-talks/pull/942',
        state: 'merged',
        author: user('PhyberApex'),
      },
    ],
  })
  const mine = item('pr', 1340, {
    repo: issue.repo,
    closingIssues: [{ ...issue, authorLogin: 'hawk90' }],
  })
  const workaround = item('pr', 942, {
    repo: 'PhyberApex/lightning-talks',
    author: user('PhyberApex'),
    state: 'merged',
    body: 'Upstream tracking: shikijs/shiki#1329. Closes #940',
    closingIssues: [
      {
        repo: 'PhyberApex/lightning-talks',
        number: 940,
        url: 'https://github.com/PhyberApex/lightning-talks/issues/940',
        state: 'closed',
        title: 'local dependency workaround',
        authorLogin: 'PhyberApex',
      },
    ],
  })
  const [draft] = buildUnitDrafts([issue, mine, workaround])
  assert.ok(draft)
  assert.equal(draft.fixedBy, null)
  assert.deepEqual(
    draft.members.map(item => `${item.repo}#${item.number}`),
    ['shikijs/shiki#1340', 'shikijs/shiki#1329'],
  )
  assert.equal(issue.timelineLinks?.[0]?.number, 942)
})

it('requires a verified target rather than a merged cross-reference or connected stub', () => {
  for (const event of ['cross-referenced', 'connected'] as const) {
    const issue = item('issue', 4, {
      timelineLinks: [{ event, repo: 'acme/app', number: 50, kind: 'pr' }],
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
    const other = item('pr', 50, { author: user('other'), state: 'merged' })
    assert.equal(buildUnitDrafts([issue, other])[0]?.fixedBy, null)
    assert.equal(buildUnitDrafts([issue])[0]?.fixedBy, null)
  }
})

it('matches closing targets by repository and number while allowing real cross-repository fixes', () => {
  const issue = item('issue', 4)
  const other = item('pr', 50, {
    repo: 'other/repo',
    author: user('other'),
    state: 'merged',
    closingIssues: [{ ...issue, repo: 'other/repo', authorLogin: issue.author.login }],
  })
  assert.equal(buildUnitDrafts([issue, other])[0]?.fixedBy, null)
  other.closingIssues = [{ ...issue, authorLogin: issue.author.login }]
  const fix = buildUnitDrafts([issue, other])[0]?.fixedBy
  assert.equal(fix?.repo, 'other/repo')
  assert.deepEqual(fix?.closes, ['acme/app#4'])
})

it('ignores an open competing pull request on the viewer pull request card', () => {
  const issue = item('issue', 4, {
    author: user('pi0'),
    linkedPullRequests: [
      {
        repo: 'acme/app',
        number: 50,
        url: 'https://github.com/acme/app/pull/50',
        state: 'open',
        author: user('other'),
      },
    ],
  })
  const closing = {
    repo: issue.repo,
    number: issue.number,
    url: issue.url,
    state: 'open' as const,
    title: issue.title,
    authorLogin: 'pi0',
  }
  const drafts = buildUnitDrafts([issue, item('pr', 12, { closingIssues: [closing] })])
  assert.equal(drafts[0]?.fixedBy, null)
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

const NOW = Date.parse('2026-10-19T12:00:00.000Z')

it('sets myTurn only for an open card whose verdict is mine', () => {
  const mineItem = item('pr', 3, {
    checks: [{ name: 'test', status: 'COMPLETED', conclusion: 'FAILURE' }],
  })
  const waitingItem = item('pr', 4, {
    checks: [{ name: 'lint', status: 'COMPLETED', conclusion: 'SUCCESS' }],
  })
  const otherItem = item('pr', 5, {
    checks: [{ name: 'lint', status: 'COMPLETED', conclusion: 'SUCCESS' }],
    activities: [
      {
        kind: 'comment',
        at: '2026-10-18T00:00:00.000Z',
        actor: user('someone'),
        body: 'I hit the same crash.',
      },
    ],
  })
  const mergedItem = item('pr', 6, {
    state: 'merged',
    closedAt: '2026-10-18T00:00:00.000Z',
    checks: [{ name: 'test', status: 'COMPLETED', conclusion: 'FAILURE' }],
  })

  const mine = toUnit(buildUnitDrafts([mineItem])[0]!, judge(mineItem, NOW), NOW)
  const waiting = toUnit(buildUnitDrafts([waitingItem])[0]!, judge(waitingItem, NOW), NOW)
  const other = toUnit(buildUnitDrafts([otherItem])[0]!, judge(otherItem, NOW), NOW)
  const merged = toUnit(buildUnitDrafts([mergedItem])[0]!, judge(mergedItem, NOW), NOW)

  assert.equal(judge(mineItem, NOW).turn, 'mine')
  assert.equal(mine.myTurn, true)
  assert.equal(mine.ended, false)
  assert.equal(judge(waitingItem, NOW).turn, 'maintainer')
  assert.equal(waiting.myTurn, false)
  assert.equal(judge(otherItem, NOW).turn, 'other')
  assert.equal(other.myTurn, false)
  assert.equal(merged.ended, true)
  assert.equal(merged.myTurn, false)
})

it('ignores the viewer and dropped bots when dating the latest other activity', () => {
  const pull = item('pr', 7, {
    checks: [],
    activities: [
      {
        kind: 'comment',
        at: '2026-10-10T00:00:00.000Z',
        actor: user('vercel[bot]'),
        body: 'Preview failed to deploy.',
      },
      {
        kind: 'comment',
        at: '2026-10-12T00:00:00.000Z',
        actor: user('someone'),
        body: 'Looks related to the cache.',
      },
      {
        kind: 'comment',
        at: '2026-10-15T00:00:00.000Z',
        actor: user(VIEWER),
        body: 'I will look tomorrow.',
      },
      {
        kind: 'comment',
        at: '2026-10-16T00:00:00.000Z',
        actor: { typename: 'Bot', login: 'cla-assistant[bot]' },
        body: 'You need to sign the CLA before this pull request can be merged.',
      },
    ],
  })
  const unit = toUnit(buildUnitDrafts([pull])[0]!, judge(pull, NOW), NOW)
  assert.equal(unit.lastOtherActivityAt, '2026-10-16T00:00:00.000Z')
})

it('previews the newest beats and keeps structural events off the card', () => {
  const pull = item('pr', 30, {
    activities: [
      { kind: 'create', actor: user(VIEWER), at: '2026-10-01T00:00:00.000Z' },
      { kind: 'push', actor: user(VIEWER), at: '2026-10-02T00:00:00.000Z' },
      {
        kind: 'review',
        actor: user('maintainer'),
        at: '2026-10-03T00:00:00.000Z',
        reviewState: 'CHANGES_REQUESTED',
      },
      { kind: 'comment', actor: user('maintainer'), at: '2026-10-04T00:00:00.000Z' },
    ],
  })
  const beats = recentBeats([pull])
  assert.deepEqual(
    beats.map(beat => beat.what),
    ['requested changes', 'commented'],
  )
  assert.deepEqual(
    beats.map(beat => beat.node),
    ['minor', 'dot'],
  )
  assert.deepEqual(
    beats.map(beat => beat.wants),
    [false, false],
  )
  assert.equal(beats.at(-1)?.actor, 'maintainer')
})

it('marks the beat that asks the viewer to act', () => {
  const pull = item('pr', 31, {
    activities: [
      {
        kind: 'review',
        actor: user('maintainer'),
        at: '2026-10-05T00:00:00.000Z',
        reviewState: 'CHANGES_REQUESTED',
      },
    ],
  })
  const beats = recentBeats([pull])
  assert.equal(beats.length, 1)
  assert.equal(beats[0]?.wants, true)
  assert.equal(beats[0]?.node, 'dot')
})

it('shows no beats when nothing but creation happened', () => {
  assert.deepEqual(recentBeats([item('issue', 32)]), [])
})
