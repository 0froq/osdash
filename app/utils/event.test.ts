import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import type { UnitEvent } from '#shared/events'
import { eventAction, eventDetail } from './event'

const source = { repo: 'acme/app', number: 12, kind: 'pr' as const }

function entry(overrides: Partial<UnitEvent> & Pick<UnitEvent, 'kind'>): UnitEvent {
  return {
    id: '1',
    at: '2026-10-20T00:00:00.000Z',
    actor: { typename: 'User', login: 'octo-dev' },
    source,
    bot: null,
    ...overrides,
  }
}

it('keeps the verb short and puts the useful bit on the detail line', () => {
  const comment = entry({
    kind: 'comment',
    excerpt: 'I will keep the comment inside the paragraph.',
  })
  assert.equal(eventAction(comment), 'commented')
  assert.deepEqual(eventDetail(comment), {
    text: 'I will keep the comment inside the paragraph.',
  })

  const review = entry({
    kind: 'review-comment',
    actor: { typename: 'Bot', login: 'coderabbitai[bot]' },
    excerpt: 'Extract the stringify helper.',
    bot: 'noise',
  })
  assert.equal(eventAction(review), 'commented on the code')
  assert.equal(eventDetail(review)?.text, 'Extract the stringify helper.')

  const ci = entry({
    kind: 'ci',
    actor: { typename: 'Bot', login: 'github-actions' },
    ci: { name: 'Vercel Agent Review', conclusion: 'NEUTRAL', status: 'COMPLETED' },
  })
  assert.equal(eventAction(ci), 'ran CI')
  assert.deepEqual(eventDetail(ci), { text: 'Vercel Agent Review', mark: 'inconclusive' })

  const failed = entry({
    kind: 'ci',
    ci: { name: 'test', conclusion: 'FAILURE', status: 'COMPLETED' },
  })
  assert.deepEqual(eventDetail(failed), { text: 'test', mark: 'failed', markTone: 'bad' })

  const commit = entry({
    kind: 'commit',
    commit: { sha: 'abcdef1234567890', message: 'fix(stringify): keep comments\n\nbody' },
  })
  assert.equal(eventAction(commit), 'committed')
  assert.deepEqual(eventDetail(commit), { text: 'fix(stringify): keep comments' })

  const shaOnly = entry({ kind: 'commit', commit: { sha: 'abcdef1234567890', message: '' } })
  assert.equal(eventDetail(shaOnly)?.text, 'abcdef1')

  const labeled = entry({ kind: 'labeled', label: { name: 'bug', color: 'd73a4a' } })
  assert.equal(eventAction(labeled), 'added')
  assert.deepEqual(eventDetail(labeled), { text: 'bug' })

  const requested = entry({ kind: 'review-requested', targetLogin: 'patak' })
  assert.equal(eventAction(requested), 'requested review')
  assert.deepEqual(eventDetail(requested), { text: '@patak' })

  const renamed = entry({ kind: 'renamed', rename: { from: 'old title', to: 'new title' } })
  assert.deepEqual(eventDetail(renamed), { text: 'old title → new title' })

  const linked = entry({
    kind: 'cross-ref',
    ref: {
      repo: 'acme/app',
      number: 466,
      kind: 'issue',
      url: 'https://github.com/acme/app/issues/466',
      title: 'Inline HTML comments are output as visible text',
    },
  })
  assert.equal(eventAction(linked), 'mentioned')
  assert.equal(eventDetail(linked)?.text, 'Inline HTML comments are output as visible text')

  assert.equal(eventDetail(entry({ kind: 'merged' })), null)
  assert.equal(eventDetail(entry({ kind: 'comment' })), null)
})
