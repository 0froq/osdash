import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { linksFromTimeline, mergeLinkedItems } from './timeline'
import type { Item, ItemKind } from './turn'

function entry(kind: ItemKind, number: number, overrides: Partial<Item> = {}): Item {
  const path = kind === 'pr' ? 'pull' : 'issues'
  return {
    kind,
    repo: 'unjs/h3',
    number,
    title: kind === 'pr' ? `fix: ${number}` : `issue ${number}`,
    url: `https://github.com/unjs/h3/${path}/${number}`,
    state: 'open',
    createdAt: '2026-10-01T00:00:00.000Z',
    closedAt: null,
    author: { typename: 'User', login: '0froq' },
    activities: [
      {
        kind: 'comment',
        at: `2026-10-0${number}T00:00:00.000Z`,
        actor: { typename: 'User', login: '0froq' },
        body: `${kind} note ${number}`,
        commentId: `${kind}-${number}`,
      },
    ],
    checks: kind === 'pr' ? [{ name: 'lint', status: 'COMPLETED', conclusion: 'SUCCESS' }] : [],
    ...overrides,
  }
}

it('reads cross-referenced and connected timeline events', () => {
  const links = linksFromTimeline([
    {
      event: 'cross-referenced',
      source: {
        type: 'issue',
        issue: {
          number: 12,
          html_url: 'https://github.com/unjs/h3/pull/12',
          repository_url: 'https://api.github.com/repos/unjs/h3',
          pull_request: { url: 'https://api.github.com/repos/unjs/h3/pulls/12' },
        },
      },
    },
    {
      event: 'connected',
      source: {
        type: 'issue',
        issue: {
          number: 4,
          html_url: 'https://github.com/other/repo/issues/4',
          repository_url: 'https://api.github.com/repos/other/repo',
        },
      },
    },
    {
      event: 'commented',
      source: { issue: { number: 99, html_url: 'https://github.com/unjs/h3/issues/99' } },
    },
    { event: 'cross-referenced' },
  ])
  assert.deepEqual(links, [
    {
      event: 'cross-referenced',
      repo: 'unjs/h3',
      number: 12,
      kind: 'pr',
      url: 'https://github.com/unjs/h3/pull/12',
    },
    {
      event: 'connected',
      repo: 'other/repo',
      number: 4,
      kind: 'issue',
      url: 'https://github.com/other/repo/issues/4',
    },
  ])
})

it('merges an issue and a pull request linked by cross-referenced', () => {
  const issue = entry('issue', 4, {
    timelineLinks: [
      {
        event: 'cross-referenced',
        repo: 'unjs/h3',
        number: 12,
        kind: 'pr',
        url: 'https://github.com/unjs/h3/pull/12',
      },
    ],
  })
  const pull = entry('pr', 12)
  const merged = mergeLinkedItems([issue, pull, entry('issue', 8)])
  assert.equal(merged.length, 2)
  const combined = merged.find(item => item.parts && item.parts.length === 2)
  assert.ok(combined)
  assert.equal(combined.kind, 'pr')
  assert.equal(combined.number, 12)
  assert.equal(combined.activities.length, 2)
  assert.deepEqual(
    combined.parts?.map(part => part.number).sort((first, second) => first - second),
    [4, 12],
  )
  assert.equal(
    merged.some(item => item.number === 8 && (item.parts?.length ?? 1) === 1),
    true,
  )
})

it('merges on a connected event from the pull request side', () => {
  const issue = entry('issue', 4, { state: 'open' })
  const pull = entry('pr', 12, {
    state: 'merged',
    closedAt: '2026-10-18T00:00:00.000Z',
    timelineLinks: [
      {
        event: 'connected',
        repo: 'unjs/h3',
        number: 4,
        kind: 'issue',
        url: 'https://github.com/unjs/h3/issues/4',
      },
    ],
  })
  const [combined] = mergeLinkedItems([issue, pull])
  assert.ok(combined)
  assert.equal(combined.state, 'merged')
  assert.equal(combined.kind, 'pr')
  assert.equal(combined.closedAt, '2026-10-18T00:00:00.000Z')
})

it('does not merge from comment text', () => {
  const issue = entry('issue', 4, { body: 'Fixes #12' })
  const pull = entry('pr', 12, { body: 'Fixes #4 and closes the issue' })
  const merged = mergeLinkedItems([issue, pull])
  assert.equal(merged.length, 2)
})

it('uses a GraphQL cross-reference the same way as a timeline event', () => {
  const issue = entry('issue', 4, {
    linkedPullRequests: [
      {
        repo: 'unjs/h3',
        number: 12,
        url: 'https://github.com/unjs/h3/pull/12',
        state: 'open',
        author: { typename: 'User', login: '0froq' },
      },
    ],
  })
  const pull = entry('pr', 12)
  assert.equal(mergeLinkedItems([issue, pull]).length, 1)
})

it('merges a claimed issue with a linked pull request missing from search results', () => {
  const issue = entry('issue', 466, {
    repo: 'comarkdown/comark',
    url: 'https://github.com/comarkdown/comark/issues/466',
    author: { typename: 'User', login: 'adamdehaven' },
    linkedPullRequests: [
      {
        repo: 'comarkdown/comark',
        number: 501,
        url: 'https://github.com/comarkdown/comark/pull/501',
        state: 'open',
        author: { typename: 'User', login: '0froq' },
      },
    ],
    timelineLinks: [
      {
        event: 'cross-referenced',
        repo: 'comarkdown/comark',
        number: 501,
        kind: 'pr',
        url: 'https://github.com/comarkdown/comark/pull/501',
      },
    ],
  })
  const [combined] = mergeLinkedItems([issue])
  assert.ok(combined)
  assert.equal(combined.kind, 'pr')
  assert.equal(combined.number, 501)
  assert.deepEqual(
    combined.parts?.map(part => part.number).sort((first, second) => first - second),
    [466, 501],
  )
})

it('merges a timeline pull link when the pull request was not loaded from search', () => {
  const issue = entry('issue', 4, {
    timelineLinks: [{ event: 'connected', repo: 'unjs/h3', number: 99, kind: 'pr' }],
  })
  const [combined] = mergeLinkedItems([issue])
  assert.ok(combined)
  assert.equal(combined.parts?.length, 2)
  assert.equal(combined.kind, 'pr')
  assert.equal(combined.number, 99)
})
