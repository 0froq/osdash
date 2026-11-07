import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import type { UnitEvent } from '#shared/events'
import type { TFunc } from '#shared/i18n'
import { createI18n } from 'vue-i18n'
import { eventAction, eventDetail } from './event'
import en from '../../i18n/locales/en'

const t = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
}).global.t as TFunc

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
  assert.equal(eventAction(t, comment), 'commented')
  assert.deepEqual(eventDetail(t, comment), {
    text: 'I will keep the comment inside the paragraph.',
  })

  const review = entry({
    kind: 'review-comment',
    actor: { typename: 'Bot', login: 'coderabbitai[bot]' },
    excerpt: 'Extract the stringify helper.',
    bot: 'noise',
  })
  assert.equal(eventAction(t, review), 'commented on the code')
  assert.equal(eventDetail(t, review)?.text, 'Extract the stringify helper.')

  const ci = entry({
    kind: 'ci',
    actor: { typename: 'Bot', login: 'github-actions' },
    ci: { name: 'Vercel Agent Review', conclusion: 'NEUTRAL', status: 'COMPLETED' },
  })
  assert.equal(eventAction(t, ci), 'ran CI')
  assert.deepEqual(eventDetail(t, ci), { text: 'Vercel Agent Review', mark: 'inconclusive' })

  const failed = entry({
    kind: 'ci',
    ci: { name: 'test', conclusion: 'FAILURE', status: 'COMPLETED' },
  })
  assert.deepEqual(eventDetail(t, failed), { text: 'test', mark: 'failed', markTone: 'bad' })

  const commit = entry({
    kind: 'commit',
    commit: { sha: 'abcdef1234567890', message: 'fix(stringify): keep comments\n\nbody' },
  })
  assert.equal(eventAction(t, commit), 'committed')
  assert.deepEqual(eventDetail(t, commit), { text: 'fix(stringify): keep comments' })

  const shaOnly = entry({ kind: 'commit', commit: { sha: 'abcdef1234567890', message: '' } })
  assert.equal(eventDetail(t, shaOnly)?.text, 'abcdef1')

  const labeled = entry({ kind: 'labeled', label: { name: 'bug', color: 'd73a4a' } })
  assert.equal(eventAction(t, labeled), 'added')
  assert.deepEqual(eventDetail(t, labeled), { text: 'bug' })

  const requested = entry({ kind: 'review-requested', targetLogin: 'patak' })
  assert.equal(eventAction(t, requested), 'requested review')
  assert.deepEqual(eventDetail(t, requested), { text: '@patak' })

  const renamed = entry({ kind: 'renamed', rename: { from: 'old title', to: 'new title' } })
  assert.deepEqual(eventDetail(t, renamed), { text: 'old title → new title' })

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
  assert.equal(eventAction(t, linked), 'mentioned')
  assert.equal(eventDetail(t, linked)?.text, 'Inline HTML comments are output as visible text')

  assert.equal(eventDetail(t, entry({ kind: 'merged' })), null)
  assert.equal(eventDetail(t, entry({ kind: 'comment' })), null)
})
