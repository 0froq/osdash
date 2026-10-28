import { RECENT_MS } from '../shared/turn'
import type { UnitCategory, UnitView } from '../shared/unit'

export function inboxCounts(
  units: readonly UnitView[],
  nowMs: number,
): {
  mine: number
  waiting: number
  ended: number
  byCategory: Record<UnitCategory, number>
} {
  const byCategory: Record<UnitCategory, number> = {
    'claimed-fix': 0,
    'direct-pr': 0,
    'reported': 0,
    'helped': 0,
  }
  let mine = 0
  let waiting = 0
  let ended = 0
  for (const unit of units) {
    byCategory[unit.category] += 1
    if (unit.ended) {
      if (unit.closedAt && nowMs - Date.parse(unit.closedAt) <= RECENT_MS) ended += 1
      continue
    }
    if (unit.myTurn) mine += 1
    else waiting += 1
  }
  return { mine, waiting, ended, byCategory }
}
