import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import type { CacheStore } from './cache'
import { DAY_MS } from '../shared/turn'
import type { Unit } from '../shared/unit'
import { mockSeen, mockUnits } from './mock'
import {
  inboxCounts,
  mergeUserState,
  pruneSeen,
  readSeen,
  writePrefs,
  writeSeen,
  type PrefsState,
  type SeenState,
} from './user-state'

const NOW = Date.parse('2026-10-19T12:00:00.000Z')

function memoryStore(): CacheStore {
  const data = new Map<string, string>()
  return {
    async get(key) {
      return data.get(key) ?? null
    },
    async put(key, value) {
      if (value === '') data.delete(key)
      else data.set(key, value)
    },
  }
}

function unit(overrides: Partial<Unit> & Pick<Unit, 'id'>): Unit {
  const sample = mockUnits(NOW)[0]!
  return {
    ...sample,
    myTurn: false,
    ended: false,
    state: 'open',
    closedAt: null,
    lastOtherActivityAt: null,
    ...overrides,
  }
}

it('writes a baseline the first time seen state is read', async () => {
  const store = memoryStore()
  const first = await readSeen(store, 'octo-dev', NOW)
  const second = await readSeen(store, 'octo-dev', NOW + 60_000)
  assert.equal(first.baselineAt, new Date(NOW).toISOString())
  assert.deepEqual(first.at, {})
  assert.equal(second.baselineAt, first.baselineAt)
})

it('marks unread only when someone else moved after the viewer last looked', () => {
  const seen: SeenState = { baselineAt: new Date(NOW - 10 * DAY_MS).toISOString(), at: {} }
  const prefs: PrefsState = { starred: [], later: {} }
  const quiet = unit({
    id: 'pr:acme/app#1',
    lastOtherActivityAt: new Date(NOW - 20 * DAY_MS).toISOString(),
  })
  const fresh = unit({
    id: 'pr:acme/app#2',
    lastOtherActivityAt: new Date(NOW - DAY_MS).toISOString(),
  })
  const own = unit({ id: 'pr:acme/app#3', lastOtherActivityAt: null })
  seen.at[fresh.id] = new Date(NOW - 2 * DAY_MS).toISOString()
  const views = mergeUserState([quiet, fresh, own], seen, prefs, NOW)
  assert.equal(views[0]?.unread, false)
  assert.equal(views[1]?.unread, true)
  assert.equal(views[2]?.unread, false)
})

it('sends an expired later card back to its section', async () => {
  const store = memoryStore()
  const id = 'pr:acme/app#11'
  await writePrefs(
    store,
    'octo-dev',
    { later: { id, until: new Date(NOW - hour()).toISOString() } },
    NOW,
  )
  const sample = mockUnits(NOW).find(entry => entry.id === id)
  assert.ok(sample)
  const prefs = { starred: [], later: { [id]: new Date(NOW - hour()).toISOString() } }
  const [view] = mergeUserState([sample], mockSeen(NOW), prefs, NOW)
  assert.equal(view?.laterUntil, null)
  const counts = inboxCounts([view!], NOW)
  assert.equal(counts.later, 0)
  assert.equal(counts.waiting + counts.mine + counts.activity, 1)
  assert.equal(store !== null, true)
})

it('drops seen marks for cards closed over 30 days ago and ids absent that long', () => {
  const closed = unit({
    id: 'pr:acme/app#old',
    state: 'closed',
    ended: true,
    closedAt: new Date(NOW - 31 * DAY_MS).toISOString(),
  })
  const recent = unit({ id: 'pr:acme/app#new', closedAt: null })
  const seen: SeenState = {
    baselineAt: new Date(NOW - 40 * DAY_MS).toISOString(),
    at: {
      [closed.id]: new Date(NOW - DAY_MS).toISOString(),
      [recent.id]: new Date(NOW - DAY_MS).toISOString(),
      'pr:acme/app#gone': new Date(NOW - 31 * DAY_MS).toISOString(),
      'pr:acme/app#soon': new Date(NOW - DAY_MS).toISOString(),
    },
  }
  const pruned = pruneSeen(seen, [closed, recent], NOW)
  assert.equal(pruned.at[closed.id], undefined)
  assert.equal(pruned.at['pr:acme/app#gone'], undefined)
  assert.equal(pruned.at[recent.id], new Date(NOW - DAY_MS).toISOString())
  assert.equal(pruned.at['pr:acme/app#soon'], new Date(NOW - DAY_MS).toISOString())
})

it('matches the mock inbox section counts', async () => {
  const units = mockUnits(NOW)
  const views = mergeUserState(units, mockSeen(NOW), { starred: [], later: {} }, NOW)
  const counts = inboxCounts(views, NOW)
  assert.equal(counts.mine, 4)
  assert.equal(counts.activity, 4)
  assert.equal(counts.waiting, 2)
  assert.equal(counts.ended, 3)
  assert.equal(counts.later, 0)
  assert.equal(views.filter(view => view.history.length > 0).length, 2)
  assert.equal(
    views.filter(view => view.issues.some(issue => issue.sharedWith.length > 0)).length,
    2,
  )
  assert.equal(views.filter(view => view.fixedBy).length, 2)
  assert.equal(views.filter(view => view.kind === 'issue-only' && view.myTurn).length, 1)
  const store = memoryStore()
  await writeSeen(
    store,
    'octo-dev',
    [{ id: views[0]!.id, at: new Date(NOW).toISOString() }],
    views,
    NOW,
  )
  const again = await readSeen(store, 'octo-dev', NOW)
  assert.equal(again.at[views[0]!.id], new Date(NOW).toISOString())
})

function hour(): number {
  return 60 * 60 * 1000
}
