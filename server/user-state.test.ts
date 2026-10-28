import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { mockUnits } from './mock'
import { inboxCounts } from './user-state'

const NOW = Date.parse('2026-10-24T00:00:00Z')

it('matches the mock inbox section counts', () => {
  const views = mockUnits(NOW).map(unit => ({
    ...unit,
    unread: false,
    notificationThreadIds: [],
    notes: [],
  }))
  const counts = inboxCounts(views, NOW)
  assert.equal(counts.mine, 4)
  assert.equal(counts.waiting, 6)
  assert.equal(counts.ended, 3)
  assert.equal(views.filter(view => view.history.length > 0).length, 2)
  assert.equal(views.filter(view => view.fixedBy).length, 2)
})
