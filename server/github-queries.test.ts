import assert from 'node:assert/strict'
import { afterEach, it, vi } from 'vite-plus/test'
import { boardSearchQueries, hydrateMissingLinkedPullRequests, mapNode, QUERY } from './github'
import { buildUnitDrafts } from '../shared/units'

afterEach(() => vi.unstubAllGlobals())

it('builds per-user GitHub search queries', () => {
  const queries = boardSearchQueries('alice', '2026-10-01')
  assert.equal(queries.length, 5)
  for (const query of queries) {
    assert.match(query, /alice/)
    assert.doesNotMatch(query, /0froq/)
  }
})

it.each([true, false])(
  'hydrates another author merged PR and verifies its actual targets (matching=%s)',
  async matching => {
    const issue = mapNode(
      {
        __typename: 'Issue',
        number: 1329,
        title: 'upstream bug',
        url: 'https://github.com/shikijs/shiki/issues/1329',
        state: 'OPEN',
        createdAt: '2026-10-10T09:03:33Z',
        repository: { nameWithOwner: 'shikijs/shiki' },
        author: { __typename: 'User', login: 'octo-dev' },
        timelineItems: {
          nodes: [
            {
              __typename: 'CrossReferencedEvent',
              source: {
                __typename: 'PullRequest',
                number: 942,
                url: 'https://github.com/PhyberApex/lightning-talks/pull/942',
                state: 'MERGED',
                merged: true,
                author: { __typename: 'User', login: 'PhyberApex' },
                repository: { nameWithOwner: 'PhyberApex/lightning-talks' },
              },
            },
          ],
        },
      },
      'octo-dev',
    )!
    const fetcher = vi.fn(async (_url: string, init: RequestInit) => {
      const { query, variables } = JSON.parse(String(init.body))
      assert.match(query, /query FixingPull/)
      assert.match(query, /closingIssuesReferences/)
      assert.doesNotMatch(query, /reviews\(|commits\(|statusCheckRollup|headRefOid/)
      assert.deepEqual(variables, { owner: 'PhyberApex', name: 'lightning-talks', number: 942 })
      return Response.json({
        data: {
          repository: {
            pullRequest: {
              __typename: 'PullRequest',
              number: 942,
              title: 'downstream patch',
              url: 'https://github.com/PhyberApex/lightning-talks/pull/942',
              state: 'MERGED',
              merged: true,
              createdAt: '2026-10-21T23:45:22Z',
              closedAt: '2026-10-21T23:48:00Z',
              repository: { nameWithOwner: 'PhyberApex/lightning-talks' },
              author: { __typename: 'User', login: 'PhyberApex' },
              closingIssuesReferences: {
                pageInfo: { hasNextPage: false },
                nodes: [
                  {
                    number: matching ? 1329 : 940,
                    repository: {
                      nameWithOwner: matching ? 'shikijs/shiki' : 'PhyberApex/lightning-talks',
                    },
                    url: matching
                      ? issue.url
                      : 'https://github.com/PhyberApex/lightning-talks/issues/940',
                    state: 'CLOSED',
                    title: 'actual target',
                    author: { login: 'hawk90' },
                  },
                ],
              },
            },
          },
        },
      })
    })
    vi.stubGlobal('fetch', fetcher)
    const items = [issue]
    await hydrateMissingLinkedPullRequests(
      'token',
      'octo-dev',
      items,
      new Set(['shikijs/shiki#1329']),
    )
    assert.equal(fetcher.mock.calls.length, 1)
    assert.equal(items[1]?.createdAt, '2026-10-21T23:45:22Z')
    const fix = buildUnitDrafts(items)[0]?.fixedBy
    assert.equal(Boolean(fix), matching)
    if (matching) assert.deepEqual(fix?.closes, ['shikijs/shiki#1329'])
  },
)

it.each(['unavailable', 'incomplete'] as const)(
  'does not guess a fix when target metadata is %s',
  async mode => {
    const issue = mapNode(
      {
        __typename: 'Issue',
        number: 4,
        title: 'bug',
        url: 'https://github.com/acme/app/issues/4',
        state: 'OPEN',
        createdAt: '2026-10-01T00:00:00Z',
        repository: { nameWithOwner: 'acme/app' },
        author: { login: 'octo-dev' },
      },
      'octo-dev',
    )!
    issue.linkedPullRequests = [
      {
        repo: 'other/repo',
        number: 50,
        url: 'https://github.com/other/repo/pull/50',
        state: 'merged',
        author: { typename: 'User', login: 'other' },
      },
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        mode === 'unavailable'
          ? new Response('', { status: 403 })
          : Response.json({
              data: {
                repository: {
                  pullRequest: {
                    closingIssuesReferences: { pageInfo: { hasNextPage: true }, nodes: [] },
                  },
                },
              },
            }),
      ),
    )
    const items = [issue]
    await hydrateMissingLinkedPullRequests('token', 'octo-dev', items, new Set(['acme/app#4']))
    assert.equal(items.length, 1)
    assert.equal(buildUnitDrafts(items)[0]?.fixedBy, null)
  },
)

it('requests closingIssuesReferences on pull requests', () => {
  assert.match(QUERY, /closingIssuesReferences/)
})

it('maps two closing issues from a pull request node', () => {
  const mapped = mapNode({
    __typename: 'PullRequest',
    number: 12,
    title: 'fix: paper',
    url: 'https://github.com/eggjs/egg/pull/12',
    state: 'OPEN',
    createdAt: '2026-10-01T00:00:00.000Z',
    repository: { nameWithOwner: 'eggjs/egg' },
    author: { __typename: 'User', login: 'octo-dev' },
    closingIssuesReferences: {
      nodes: [
        {
          number: 4,
          url: 'https://github.com/eggjs/egg/issues/4',
          state: 'OPEN',
          title: 'paper tears',
          repository: { nameWithOwner: 'eggjs/egg' },
          author: { __typename: 'User', login: 'pi0' },
        },
        {
          number: 9,
          url: 'https://github.com/other/repo/issues/9',
          state: 'CLOSED',
          title: 'also tears',
          repository: { nameWithOwner: 'other/repo' },
          author: { __typename: 'User', login: 'alice' },
        },
      ],
    },
  })
  assert.ok(mapped)
  assert.equal(mapped.closingIssues?.length, 2)
  assert.equal(mapped.closingIssues?.[0]?.number, 4)
  assert.equal(mapped.closingIssues?.[0]?.state, 'open')
  assert.equal(mapped.closingIssues?.[0]?.authorLogin, 'pi0')
  assert.equal(mapped.closingIssues?.[1]?.state, 'closed')
  assert.equal(mapped.closingIssues?.[1]?.repo, 'other/repo')
})
