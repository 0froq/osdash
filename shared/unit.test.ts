import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { compareWaitingUnits } from './unit'

it('orders waiting contributions unread first and newest first within each read state', () => {
  const units = [
    { id: 'read-old', unread: false, ageMs: 30 },
    { id: 'unread-old', unread: true, ageMs: 20 },
    { id: 'read-new', unread: false, ageMs: 1 },
    { id: 'unread-new', unread: true, ageMs: 10 },
  ]
  assert.deepEqual(
    units.sort(compareWaitingUnits).map(unit => unit.id),
    ['unread-new', 'unread-old', 'read-new', 'read-old'],
  )

  units[0]!.unread = false
  assert.deepEqual(
    units.sort(compareWaitingUnits).map(unit => unit.id),
    ['unread-old', 'read-new', 'unread-new', 'read-old'],
  )
})

it('keeps equal-age waiting contributions in their existing order', () => {
  const units = [
    { id: 'first', unread: false, ageMs: 10 },
    { id: 'second', unread: false, ageMs: 10 },
  ]
  assert.deepEqual(
    units.sort(compareWaitingUnits).map(unit => unit.id),
    ['first', 'second'],
  )
})
