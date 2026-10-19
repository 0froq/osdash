import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import {
  buildClassifierState,
  CLEF_MAX_PRIOR_COMMENTS,
  CLEF_MAX_STATE_TOKEN_ESTIMATE,
  estimateStateTokens,
  type ClaimClassifierContext,
} from './claim-classifier'
import type { Activity, Actor } from './turn'

function user(login: string): Actor {
  return { typename: 'User', login }
}

function comment(id: string, at: string, body: string, login = 'someone'): Activity {
  return {
    kind: 'comment',
    at,
    actor: user(login),
    body,
    commentId: id,
    updatedAt: at,
    url: `https://github.com/unjs/h3/issues/100#issuecomment-${id}`,
  }
}

function context(
  thread: Activity[],
  focus: Activity,
  title = 'Long thread issue',
): ClaimClassifierContext {
  return {
    issueTitle: title,
    comment: focus,
    thread,
    role: 'self',
  }
}

it('keeps at most five prior comments before the focus comment', () => {
  const focus = comment('focus', '2026-10-19T12:00:00.000Z', 'I will open a PR', '0froq')
  const thread = [
    ...Array.from({ length: 8 }, (_, index) =>
      comment(
        `prior-${index}`,
        new Date(Date.parse('2026-10-19T12:00:00.000Z') - (index + 1) * 60_000).toISOString(),
        `prior ${index}`,
      ),
    ),
    focus,
  ]
  const state = buildClassifierState(context(thread, focus))
  const prior = state.prior_comments as unknown[]
  assert.equal(prior.length, CLEF_MAX_PRIOR_COMMENTS)
  assert.equal((prior[0] as { body: string }).body, 'prior 4')
  assert.equal((prior.at(-1) as { body: string }).body, 'prior 0')
})

it('truncates a long thread to stay within the token estimate limit', () => {
  const huge = 'x'.repeat(8_000)
  const focus = comment('focus', '2026-10-19T12:00:00.000Z', huge, '0froq')
  const thread = [
    ...Array.from({ length: 12 }, (_, index) =>
      comment(
        `prior-${index}`,
        new Date(Date.parse('2026-10-19T12:00:00.000Z') - (index + 1) * 60_000).toISOString(),
        huge,
      ),
    ),
    focus,
  ]
  const state = buildClassifierState(context(thread, focus, huge))
  assert.equal(estimateStateTokens(state) <= CLEF_MAX_STATE_TOKEN_ESTIMATE, true)
  const prior = state.prior_comments as unknown[]
  assert.equal(prior.length <= CLEF_MAX_PRIOR_COMMENTS, true)
  assert.equal((state.focus_comment as { body: string }).body.length < huge.length, true)
})
