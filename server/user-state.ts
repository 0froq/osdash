import { readStored, writeStored, type CacheStore } from './cache'
import { RECENT_MS } from '../shared/turn'
import type { Unit, UnitCategory, UnitView } from '../shared/unit'

const SEEN_PREFIX = 'seen:v1:'
const PREFS_PREFIX = 'prefs:v1:'
const KEEP_MS = 30 * 24 * 60 * 60 * 1000
const WRITE_GAP_MS = 1000

export type SeenState = {
  baselineAt: string
  at: Record<string, string>
}

export type PrefsState = {
  starred: string[]
  later: Record<string, string>
}

export type SeenMark = { id: string; at: string }

export type PrefsPatch = {
  star?: { id: string; on: boolean }
  later?: { id: string; until: string | null }
}

type PendingWrite = { json: string; flushedAt: number }

const pending = new Map<string, PendingWrite>()

function seenKey(login: string): string {
  return `${SEEN_PREFIX}${login.toLowerCase()}`
}

function prefsKey(login: string): string {
  return `${PREFS_PREFIX}${login.toLowerCase()}`
}

function emptySeen(nowMs: number): SeenState {
  return { baselineAt: new Date(nowMs).toISOString(), at: {} }
}

function emptyPrefs(): PrefsState {
  return { starred: [], later: {} }
}

async function loadJson(
  store: CacheStore | undefined,
  key: string,
  nowMs: number,
): Promise<string | null> {
  const slot = pending.get(key)
  if (slot) return slot.json
  return readStored(store, key, nowMs)
}

async function saveJson(
  store: CacheStore | undefined,
  key: string,
  json: string,
  nowMs: number,
): Promise<void> {
  const slot = pending.get(key)
  if (slot && nowMs - slot.flushedAt < WRITE_GAP_MS) {
    pending.set(key, { json, flushedAt: slot.flushedAt })
    return
  }
  await writeStored(store, key, json)
  pending.set(key, { json, flushedAt: nowMs })
}

function parseSeen(raw: string | null, nowMs: number): SeenState | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SeenState
    if (!parsed.baselineAt || typeof parsed.at !== 'object' || parsed.at === null) return null
    return { baselineAt: parsed.baselineAt, at: { ...parsed.at } }
  } catch {
    return emptySeen(nowMs)
  }
}

function parsePrefs(raw: string | null): PrefsState {
  if (!raw) return emptyPrefs()
  try {
    const parsed = JSON.parse(raw) as PrefsState
    return {
      starred: Array.isArray(parsed.starred)
        ? parsed.starred.filter(id => typeof id === 'string')
        : [],
      later:
        parsed.later && typeof parsed.later === 'object'
          ? Object.fromEntries(
              Object.entries(parsed.later).filter(
                (entry): entry is [string, string] => typeof entry[1] === 'string',
              ),
            )
          : {},
    }
  } catch {
    return emptyPrefs()
  }
}

export function pruneSeen(seen: SeenState, units: readonly Unit[], nowMs: number): SeenState {
  const byId = new Map(units.map(unit => [unit.id, unit]))
  const at: Record<string, string> = {}
  for (const [id, stamp] of Object.entries(seen.at)) {
    const unit = byId.get(id)
    if (unit) {
      if (unit.closedAt && nowMs - Date.parse(unit.closedAt) > KEEP_MS) continue
      at[id] = stamp
      continue
    }
    if (nowMs - Date.parse(stamp) > KEEP_MS) continue
    at[id] = stamp
  }
  return { baselineAt: seen.baselineAt, at }
}

export async function readSeen(
  store: CacheStore | undefined,
  login: string,
  nowMs: number,
): Promise<SeenState> {
  const key = seenKey(login)
  const parsed = parseSeen(await loadJson(store, key, nowMs), nowMs)
  if (parsed) return parsed
  const fresh = emptySeen(nowMs)
  await saveJson(store, key, JSON.stringify(fresh), nowMs)
  return fresh
}

export async function writeSeen(
  store: CacheStore | undefined,
  login: string,
  marks: readonly SeenMark[],
  units: readonly Unit[],
  nowMs: number,
): Promise<SeenState> {
  const seen = await readSeen(store, login, nowMs)
  let changed = false
  for (const mark of marks) {
    if (!mark.id || !mark.at) continue
    const current = seen.at[mark.id]
    if (current && current >= mark.at) continue
    seen.at[mark.id] = mark.at
    changed = true
  }
  const pruned = pruneSeen(seen, units, nowMs)
  if (changed || JSON.stringify(pruned.at) !== JSON.stringify(seen.at)) {
    await saveJson(store, seenKey(login), JSON.stringify(pruned), nowMs)
  }
  return pruned
}

export async function readPrefs(
  store: CacheStore | undefined,
  login: string,
  nowMs: number,
): Promise<PrefsState> {
  return parsePrefs(await loadJson(store, prefsKey(login), nowMs))
}

export async function writePrefs(
  store: CacheStore | undefined,
  login: string,
  patch: PrefsPatch,
  nowMs: number,
): Promise<PrefsState> {
  const prefs = await readPrefs(store, login, nowMs)
  if (patch.star) {
    const starred = new Set(prefs.starred)
    if (patch.star.on) starred.add(patch.star.id)
    else starred.delete(patch.star.id)
    prefs.starred = [...starred]
  }
  if (patch.later) {
    if (!patch.later.until) delete prefs.later[patch.later.id]
    else prefs.later[patch.later.id] = patch.later.until
  }
  await saveJson(store, prefsKey(login), JSON.stringify(prefs), nowMs)
  return prefs
}

export function laterActive(unit: { laterUntil: string | null }, nowMs: number): boolean {
  return unit.laterUntil !== null && Date.parse(unit.laterUntil) > nowMs
}

export function mergeUserState(
  units: readonly Unit[],
  seen: SeenState,
  prefs: PrefsState,
  nowMs: number,
): UnitView[] {
  const starred = new Set(prefs.starred)
  return units.map(unit => {
    const stamp = seen.at[unit.id] ?? seen.baselineAt
    const until = prefs.later[unit.id] ?? null
    const laterUntil = until && Date.parse(until) > nowMs ? until : null
    return {
      ...unit,
      unread: unit.lastOtherActivityAt !== null && unit.lastOtherActivityAt > stamp,
      starred: starred.has(unit.id),
      laterUntil,
    }
  })
}

export function inboxCounts(
  units: readonly UnitView[],
  nowMs: number,
): {
  mine: number
  activity: number
  waiting: number
  ended: number
  later: number
  starred: number
  byCategory: Record<UnitCategory, number>
} {
  const byCategory: Record<UnitCategory, number> = {
    'claimed-fix': 0,
    'direct-pr': 0,
    'reported': 0,
    'helped': 0,
  }
  let mine = 0
  let activity = 0
  let waiting = 0
  let ended = 0
  let later = 0
  let starred = 0
  for (const unit of units) {
    byCategory[unit.category] += 1
    if (unit.starred) starred += 1
    if (laterActive(unit, nowMs)) {
      later += 1
      continue
    }
    if (unit.ended) {
      if (unit.closedAt && nowMs - Date.parse(unit.closedAt) <= RECENT_MS) ended += 1
      continue
    }
    if (unit.myTurn) mine += 1
    else if (unit.unread) activity += 1
    else waiting += 1
  }
  return { mine, activity, waiting, ended, later, starred, byCategory }
}
