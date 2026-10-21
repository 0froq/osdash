import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { boardSearchQueries, mapNode, QUERY } from './github'

it('builds per-user GitHub search queries', () => {
  const queries = boardSearchQueries('alice', '2026-10-01')
  assert.equal(queries.length, 5)
  for (const query of queries) {
    assert.match(query, /alice/)
    assert.doesNotMatch(query, /0froq/)
  }
})

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
