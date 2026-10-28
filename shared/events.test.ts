import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import {
  foldEntries,
  normalizeCheckRuns,
  normalizeRestTimeline,
  normalizeReviewComments,
  timelineSourceKind,
  type RawRestTimelineEvent,
} from './events'

const source = { repo: 'acme/app', number: 12, kind: 'pr' as const }

function raw(event: string, overrides: RawRestTimelineEvent = {}): RawRestTimelineEvent {
  return {
    id: event,
    event,
    created_at: '2026-10-20T00:00:00.000Z',
    actor: { login: 'octo-dev', type: 'User' },
    ...overrides,
  }
}

it('maps each known timeline event and drops unknown ones', () => {
  const events = normalizeRestTimeline(
    [
      raw('commented', {
        body: 'Hello **world**',
        html_url: 'https://github.com/acme/app/issues/12#issuecomment-1',
      }),
      raw('reviewed', { state: 'CHANGES_REQUESTED', body: 'Please split this.' }),
      raw('committed', { sha: 'abc', message: 'fix it' }),
      raw('head_ref_force_pushed'),
      raw('labeled', { label: { name: 'bug', color: 'd73a4a' } }),
      raw('unlabeled', { label: { name: 'bug', color: 'd73a4a' } }),
      raw('assigned', { assignee: { login: 'octo-dev' } }),
      raw('unassigned'),
      raw('review_requested', { requested_reviewer: { login: 'patak' } }),
      raw('cross-referenced', {
        source: {
          issue: {
            number: 4,
            html_url: 'https://github.com/acme/app/issues/4',
            repository_url: 'https://api.github.com/repos/acme/app',
            title: 'tears',
          },
        },
      }),
      raw('connected', {
        source: {
          issue: {
            number: 4,
            html_url: 'https://github.com/acme/app/issues/4',
            repository_url: 'https://api.github.com/repos/acme/app',
          },
        },
      }),
      raw('renamed', { rename: { from: 'old', to: 'new' } }),
      raw('merged'),
      raw('closed'),
      raw('reopened'),
      raw('subscribed'),
    ],
    source,
  )
  assert.deepEqual(
    events.map(event => event.kind),
    [
      'comment',
      'review',
      'commit',
      'force-push',
      'labeled',
      'unlabeled',
      'assigned',
      'unassigned',
      'review-requested',
      'cross-ref',
      'connected',
      'renamed',
      'merged',
      'closed',
      'reopened',
    ],
  )
  assert.equal(events[0]?.excerpt, 'Hello world')
  assert.equal(events[1]?.reviewState, 'CHANGES_REQUESTED')
  assert.equal(events[2]?.commit?.sha, 'abc')
  assert.equal(events[4]?.label?.name, 'bug')
  assert.equal(events[6]?.targetLogin, 'octo-dev')
  assert.equal(events[8]?.targetLogin, 'patak')
  assert.equal(events[0]?.targetLogin, undefined)
  assert.equal(events[9]?.ref?.number, 4)
  assert.equal(events[11]?.rename?.to, 'new')
})

it('folds noise bots but leaves a failing CLA comment alone', () => {
  const events = normalizeRestTimeline(
    [
      raw('commented', {
        id: 'v1',
        created_at: '2026-10-20T00:00:00.000Z',
        actor: { login: 'vercel[bot]', type: 'Bot' },
        body: 'Preview deployed',
      }),
      raw('commented', {
        id: 'v2',
        created_at: '2026-10-20T00:01:00.000Z',
        actor: { login: 'vercel[bot]', type: 'Bot' },
        body: 'Preview updated',
      }),
      raw('commented', {
        id: 'cla',
        created_at: '2026-10-20T00:02:00.000Z',
        actor: { login: 'cla-assistant[bot]', type: 'Bot' },
        body: 'You need to sign the CLA before this pull request can be merged.',
      }),
      raw('commented', {
        id: 'v3',
        created_at: '2026-10-20T00:03:00.000Z',
        actor: { login: 'vercel[bot]', type: 'Bot' },
        body: 'Preview ready',
      }),
    ],
    source,
  )
  const folded = foldEntries(events)
  assert.equal(folded.length, 3)
  assert.equal(folded[0]?.kind, 'bot-group')
  assert.equal(folded[0] && 'count' in folded[0] ? folded[0].count : 0, 2)
  assert.equal(folded[1]?.kind, 'comment')
  assert.equal(folded[1] && 'bot' in folded[1] ? folded[1].bot : null, 'keep')
  assert.equal(folded[2]?.kind, 'bot-group')
  assert.equal(folded[2] && 'count' in folded[2] ? folded[2].count : 0, 1)
})

it('normalizes review comments and completed check runs', () => {
  const comments = normalizeReviewComments(
    [
      {
        id: 7,
        user: { login: 'patak', type: 'User' },
        body: '> quoted line\n\nActual note',
        created_at: '2026-10-20T01:00:00.000Z',
        html_url: 'https://github.com/acme/app/pull/12#discussion_r7',
      },
    ],
    source,
  )
  assert.equal(comments[0]?.kind, 'review-comment')
  assert.equal(comments[0]?.excerpt, 'Actual note')

  const checks = normalizeCheckRuns(
    [
      {
        id: 1,
        name: 'lint',
        status: 'completed',
        conclusion: 'success',
        completed_at: '2026-10-20T02:00:10.000Z',
      },
      {
        id: 2,
        name: 'test',
        status: 'completed',
        conclusion: 'failure',
        completed_at: '2026-10-20T02:00:40.000Z',
      },
      { id: 3, name: 'queued', status: 'queued', conclusion: null },
    ],
    source,
    'abc',
  )
  const folded = foldEntries(checks)
  assert.equal(folded.length, 1)
  assert.equal(folded[0]?.kind, 'ci-group')
  if (folded[0]?.kind === 'ci-group') {
    assert.equal(folded[0].passed, 1)
    assert.equal(folded[0].failed, 1)
    assert.equal(folded[0].sha, 'abc')
  }
})

it('omits the card PR number and keeps issue numbers', () => {
  const subject = { repo: 'acme/app', number: 12, kind: 'pr' as const }
  assert.equal(timelineSourceKind(subject, subject), null)
  assert.equal(
    timelineSourceKind({ repo: 'acme/app', number: 100, kind: 'issue' }, subject),
    'issue',
  )
  assert.equal(timelineSourceKind({ repo: 'acme/app', number: 9, kind: 'pr' }, subject), 'pr')
})

it('retains complete comment bodies separately from clean bounded summaries', () => {
  const body = `<details><summary>Bot report</summary><p>**Keep the full report.** ${'More detail. '.repeat(30)}</p></details>`
  const events = normalizeRestTimeline(
    [raw('commented', { body }), raw('reviewed', { body, state: 'COMMENTED' })],
    source,
  )
  const comments = normalizeReviewComments(
    [{ id: 'inline', created_at: '2026-10-20T01:00:00Z', body }],
    source,
  )
  for (const event of [...events, ...comments]) {
    assert.equal(event.body, body)
    assert.ok(event.excerpt)
    assert.ok(Array.from(event.excerpt).length <= 140)
    assert.doesNotMatch(event.excerpt, /<\/?(?:details|summary|p)>/)
    assert.match(event.excerpt, /Bot report/)
  }
})

it('carries author association and flags claim comments only when present', () => {
  const events = normalizeRestTimeline(
    [
      raw('commented', {
        id: 'claim',
        body: 'I can take this one. The fix probably belongs in the html plugin.',
        author_association: 'CONTRIBUTOR',
      }),
      raw('commented', { id: 'plain', body: 'Looks good.', author_association: 'MEMBER' }),
      raw('reviewed', { id: 'rev', state: 'APPROVED', author_association: 'OWNER' }),
      raw('labeled', { id: 'lab', label: { name: 'bug' } }),
    ],
    source,
  )
  assert.equal(events[0]?.association, 'CONTRIBUTOR')
  assert.equal(events[0]?.claim, true)
  assert.equal(events[1]?.association, 'MEMBER')
  assert.equal('claim' in events[1]!, false)
  assert.equal(events[2]?.association, 'OWNER')
  assert.equal('claim' in events[2]!, false)
  assert.equal('association' in events[3]!, false)
  assert.equal('claim' in events[3]!, false)

  const comments = normalizeReviewComments(
    [
      {
        id: 1,
        user: { login: 'patak', type: 'User' },
        body: 'I can take this one',
        author_association: 'MEMBER',
        created_at: '2026-10-20T01:00:00.000Z',
      },
      { id: 2, user: { login: 'x', type: 'User' }, created_at: '2026-10-20T01:00:00.000Z' },
    ],
    source,
  )
  assert.equal(comments[0]?.association, 'MEMBER')
  assert.equal('claim' in comments[0]!, false)
  assert.equal('association' in comments[1]!, false)
})
