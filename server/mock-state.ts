import type { H3Event } from 'h3'
import { getQuery } from 'h3'
import { mockSeen, mockUnits } from './mock'
import {
  pruneSeen,
  type PrefsPatch,
  type PrefsState,
  type SeenMark,
  type SeenState,
} from './user-state'
import type { Unit } from '../shared/unit'

type MockMemory = {
  seen: SeenState | null
  prefs: PrefsState
}

const memory: MockMemory = {
  seen: null,
  prefs: { starred: [], later: {} },
}

export function devMock(event: H3Event): boolean {
  if (!import.meta.dev) return false
  const query = getQuery(event)
  return query.mock === '1' || process.env.OSDASH_MOCK === '1'
}

export function mockSeenState(nowMs: number): SeenState {
  return memory.seen ?? mockSeen(nowMs)
}

export function mockPrefsState(): PrefsState {
  return {
    starred: [...memory.prefs.starred],
    later: { ...memory.prefs.later },
  }
}

export function mockMarkSeen(
  marks: readonly SeenMark[],
  units: readonly Unit[],
  nowMs: number,
): SeenState {
  const seen = memory.seen ?? mockSeen(nowMs)
  for (const mark of marks) {
    if (!mark.id || !mark.at) continue
    const current = seen.at[mark.id]
    if (current && current >= mark.at) continue
    seen.at[mark.id] = mark.at
  }
  memory.seen = pruneSeen(seen, units, nowMs)
  return memory.seen
}

export function mockPatchPrefs(patch: PrefsPatch): PrefsState {
  if (patch.star) {
    const starred = new Set(memory.prefs.starred)
    if (patch.star.on) starred.add(patch.star.id)
    else starred.delete(patch.star.id)
    memory.prefs.starred = [...starred]
  }
  if (patch.later) {
    if (!patch.later.until) delete memory.prefs.later[patch.later.id]
    else memory.prefs.later[patch.later.id] = patch.later.until
  }
  return mockPrefsState()
}

export function mockUnitsNow(nowMs: number): Unit[] {
  return mockUnits(nowMs)
}
