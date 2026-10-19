import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import {
  CLAIM_COMMENT_PATTERNS,
  claimLevel,
  claimWaitingSince,
  hideIssueForLinkedPr,
  includeIssueOnBoard,
  isClaimComment,
  isClaimInvalidated,
  isClaimQuestion,
  isRelinquishComment,
  selfClaimedStaleTone,
} from './claim'
import { DAY_MS, judge, type Activity, type Actor, type Item } from './turn'

const NOW = Date.parse('2026-10-19T12:00:00.000Z')

function ago(ms: number): string {
  return new Date(NOW - ms).toISOString()
}

function user(login: string, typename = 'User'): Actor {
  return { typename, login }
}

function issue(overrides: Partial<Item> = {}): Item {
  return {
    kind: 'issue',
    repo: 'unjs/h3',
    number: 100,
    title: 'sample issue',
    url: 'https://github.com/unjs/h3/issues/100',
    state: 'open',
    createdAt: ago(5 * DAY_MS),
    closedAt: null,
    author: user('pi0'),
    activities: [],
    checks: [],
    assignees: [],
    linkedPullRequests: [],
    ...overrides,
  }
}

function comment(
  overrides: Partial<Activity> & Pick<Activity, 'actor' | 'at'> & { body: string },
): Activity {
  return {
    kind: 'comment',
    url: 'https://github.com/unjs/h3/issues/100#issuecomment-1',
    ...overrides,
  }
}

it('matches exported claim comment patterns with small variations', () => {
  assert.equal(CLAIM_COMMENT_PATTERNS.length > 0, true)
  assert.equal(isClaimComment("I'll open a PR for this"), true)
  assert.equal(isClaimComment('I will open a PR'), true)
  assert.equal(isClaimComment("I'd like to work on this one"), true)
  assert.equal(isClaimComment('I can take this'), true)
  assert.equal(isClaimComment('Happy to submit a PR'), true)
  assert.equal(isClaimComment("I'm working on a fix"), true)
  assert.equal(isClaimComment('I am working on a fix'), true)
  assert.equal(isClaimComment('just looking'), false)
})

it('detects claim questions that end with ?', () => {
  assert.equal(isClaimQuestion('Can I take this?'), true)
  assert.equal(isClaimQuestion("I'll open a PR?"), true)
  assert.equal(isClaimQuestion('Can I take this'), false)
})

it('assigned: me in assignees is the strongest claim level', () => {
  const level = claimLevel(
    issue({
      assignees: [user('0froq')],
      activities: [comment({ actor: user('0froq'), at: ago(DAY_MS), body: "I'll open a PR" })],
    }),
  )
  assert.equal(level, 'assigned')
})

it('confirmed: claim comment followed by maintainer reply', () => {
  const level = claimLevel(
    issue({
      activities: [
        comment({ actor: user('0froq'), at: ago(2 * DAY_MS), body: "I'll open a PR" }),
        comment({
          actor: user('pi0'),
          at: ago(DAY_MS),
          body: 'Sounds good',
          authorAssociation: 'MEMBER',
        }),
      ],
    }),
  )
  assert.equal(level, 'confirmed')
})

it('self-claimed: only my claim comment without maintainer response', () => {
  const level = claimLevel(
    issue({
      activities: [comment({ actor: user('0froq'), at: ago(DAY_MS), body: "I'll open a PR" })],
    }),
  )
  assert.equal(level, 'self-claimed')
})

it('pending claim question waits on others in judge', () => {
  const verdict = judge(
    issue({
      activities: [comment({ actor: user('0froq'), at: ago(DAY_MS), body: 'Can I take this?' })],
    }),
    NOW,
  )
  assert.equal(verdict.turn, 'maintainer')
  assert.equal(verdict.reason, 'Claim pending approval')
})

it('claimed without linked PR is your move', () => {
  const verdict = judge(
    issue({
      activities: [comment({ actor: user('0froq'), at: ago(DAY_MS), body: "I'll open a PR" })],
    }),
    NOW,
  )
  assert.equal(verdict.turn, 'me')
  assert.equal(verdict.reason, 'Claimed, open a PR')
  assert.deepEqual(verdict.labels, ['Self-claimed'])
})

it('confirmed and assigned claims do not show the self-claimed badge', () => {
  const assigned = judge(
    issue({
      assignees: [user('0froq')],
      activities: [comment({ actor: user('0froq'), at: ago(DAY_MS), body: "I'll open a PR" })],
    }),
    NOW,
  )
  assert.deepEqual(assigned.labels, [])

  const confirmed = judge(
    issue({
      activities: [
        comment({ actor: user('0froq'), at: ago(2 * DAY_MS), body: "I'll open a PR" }),
        comment({
          actor: user('pi0'),
          at: ago(DAY_MS),
          body: 'go for it',
          authorAssociation: 'OWNER',
        }),
      ],
    }),
    NOW,
  )
  assert.deepEqual(confirmed.labels, [])
})

it('invalidates when the issue is assigned to someone else', () => {
  const assignedElsewhere = issue({
    assignees: [user('pi0')],
    activities: [comment({ actor: user('0froq'), at: ago(DAY_MS), body: "I'll open a PR" })],
  })
  assert.equal(isClaimInvalidated(assignedElsewhere), true)
  assert.equal(claimLevel(assignedElsewhere), null)
  assert.equal(includeIssueOnBoard(assignedElsewhere), false)
})

it('invalidates when someone else links a PR', () => {
  const invalidated = issue({
    linkedPullRequests: [
      {
        repo: 'unjs/h3',
        number: 99,
        url: 'https://github.com/unjs/h3/pull/99',
        state: 'open',
        author: user('pi0'),
      },
    ],
    activities: [comment({ actor: user('0froq'), at: ago(DAY_MS), body: "I'll open a PR" })],
  })
  assert.equal(isClaimInvalidated(invalidated), true)
  assert.equal(claimLevel(invalidated), null)
  assert.equal(includeIssueOnBoard(invalidated), false)
})

it('invalidates on relinquish comments and closed issues', () => {
  assert.equal(isRelinquishComment('please unassign me'), true)
  assert.equal(isRelinquishComment('go ahead'), true)

  const relinquished = issue({
    activities: [comment({ actor: user('0froq'), at: ago(DAY_MS), body: 'go ahead' })],
  })
  assert.equal(isClaimInvalidated(relinquished), true)

  const closed = issue({ state: 'closed', closedAt: ago(DAY_MS) })
  assert.equal(isClaimInvalidated(closed), true)
})

it('hides the issue card when my linked PR is still open', () => {
  const hidden = issue({
    linkedPullRequests: [
      {
        repo: 'unjs/h3',
        number: 101,
        url: 'https://github.com/unjs/h3/pull/101',
        state: 'open',
        author: user('0froq'),
      },
    ],
    activities: [comment({ actor: user('0froq'), at: ago(DAY_MS), body: "I'll open a PR" })],
  })
  assert.equal(hideIssueForLinkedPr(hidden), true)
})

it('colors self-claimed waits past 7 and 14 days', () => {
  assert.equal(selfClaimedStaleTone(7 * DAY_MS), 'none')
  assert.equal(selfClaimedStaleTone(7 * DAY_MS + 1), 'yellow')
  assert.equal(selfClaimedStaleTone(14 * DAY_MS + 1), 'red')

  const stale = judge(
    issue({
      activities: [comment({ actor: user('0froq'), at: ago(15 * DAY_MS), body: "I'll open a PR" })],
    }),
    NOW,
  )
  assert.equal(stale.tone, 'red')
})

it('uses the claim comment time as waitingSince', () => {
  const at = ago(3 * DAY_MS)
  const since = claimWaitingSince(
    issue({
      activities: [comment({ actor: user('0froq'), at, body: "I'll open a PR" })],
    }),
  )
  assert.equal(since, at)
})

it('includes non-author issues only when an active claim exists', () => {
  const claimed = issue({
    activities: [comment({ actor: user('0froq'), at: ago(DAY_MS), body: "I'll open a PR" })],
  })
  assert.equal(includeIssueOnBoard(claimed), true)

  const random = issue({
    activities: [comment({ actor: user('0froq'), at: ago(DAY_MS), body: 'thanks!' })],
  })
  assert.equal(includeIssueOnBoard(random), false)

  const authored = issue({ author: user('0froq') })
  assert.equal(includeIssueOnBoard(authored), true)
})
