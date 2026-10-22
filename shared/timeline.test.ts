import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { linksFromTimeline } from './timeline'
import { buildUnitDrafts } from './units'
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
    viewerLogin: '0froq',
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

it('does not make a card from a linked pull authored by someone else', () => {
  const issue = entry('issue', 4, {
    viewerLogin: 'octo-dev',
    author: { typename: 'User', login: 'octo-dev' },
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
  const drafts = buildUnitDrafts([issue])
  assert.equal(drafts.length, 1)
  assert.equal(drafts[0]?.kind, 'issue-only')
  assert.equal(drafts[0]?.primary.author.login, 'octo-dev')
  assert.equal(drafts[0]?.fixedBy?.authorLogin, '0froq')
})
