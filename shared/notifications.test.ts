import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { cardNotification, parseNotificationSubject, unreadIndex } from './notifications'

const issue = 'https://api.github.com/repos/acme/app/issues/319'
const pr = 'https://api.github.com/repos/acme/app/pulls/327'

it('parses an issue or pull request subject and rejects a malformed url', () => {
  assert.deepEqual(parseNotificationSubject('t1', issue), {
    repo: 'acme/app',
    number: 319,
    threadId: 't1',
  })
  assert.deepEqual(parseNotificationSubject('t2', pr), {
    repo: 'acme/app',
    number: 327,
    threadId: 't2',
  })
  assert.equal(parseNotificationSubject('t3', 'https://github.com/acme/app/issues/1'), null)
  assert.equal(parseNotificationSubject('', issue), null)
})

it('marks a card unread only from its own members', () => {
  const index = unreadIndex([
    parseNotificationSubject('issue', issue)!,
    parseNotificationSubject('pr', pr)!,
  ])
  const both = cardNotification(
    [
      { repo: 'acme/app', number: 319 },
      { repo: 'acme/app', number: 327 },
    ],
    index,
  )
  assert.equal(both.unread, true)
  assert.deepEqual(both.notificationThreadIds, ['issue', 'pr'])

  const one = cardNotification([{ repo: 'acme/app', number: 327 }], index)
  assert.deepEqual(one.notificationThreadIds, ['pr'])

  const none = cardNotification([{ repo: 'acme/app', number: 1 }], index)
  assert.equal(none.unread, false)
  assert.deepEqual(none.notificationThreadIds, [])

  const fixerOnly = cardNotification([], index)
  assert.equal(fixerOnly.unread, false)
})
