import { describe, expect, it } from 'vite-plus/test'
import { breakTies, nearestSlot, rowAt, stampAfter } from './noteAnchor'

const MINUTE = 60_000
const T0 = Date.parse('2026-04-15T10:00:00Z')

/**
 * The story from the bug report: an issue opened, two labels added in the same
 * second (folded into one group), a comment 20 minutes later, then NOW. Times as
 * GitHub gives them, so the first label shares the issue's second.
 */
const raw = [
  { id: 'opened', at: T0 },
  { id: 'label-1', at: T0 },
  { id: 'label-2', at: T0 + 2_000 },
  { id: 'comment', at: T0 + 20 * MINUTE },
]
const stamps = breakTies(raw.map(line => line.at))
const NOW = stamps.at(-1)! + 1
const all = [...stamps, NOW]

function drop(afterIndex: number): number {
  return stampAfter(all[afterIndex]!, all[afterIndex + 1] ?? Number.POSITIVE_INFINITY)
}

/** The rows on screen. The folded group's lines are only present when it is open. */
function rows(open: boolean) {
  const line = (index: number) => ({ id: raw[index]!.id, time: stamps[index]! })
  // A collapsed group stands at its last event; an open one has no time of its own.
  const group = open ? [line(1), line(2)] : [{ id: 'fold', time: stamps[2]! }]
  return [line(0), ...group, line(3), { id: 'now', time: NOW }]
}

describe('breakTies', () => {
  it('keeps distinct times and spaces equal ones by a millisecond', () => {
    expect(breakTies([5, 5, 5, 9])).toEqual([5, 6, 7, 9])
  })

  it('never moves a time earlier', () => {
    expect(breakTies([10, 3, 4])).toEqual([10, 11, 12])
  })
})

describe('stampAfter', () => {
  it('is a minute after the row when the next event is far away', () => {
    expect(stampAfter(T0, T0 + 20 * MINUTE)).toBe(T0 + MINUTE)
  })

  it('stays below the next event when it is closer than a minute', () => {
    expect(stampAfter(T0 + 20 * MINUTE, T0 + 20 * MINUTE + 5_000)).toBe(T0 + 20 * MINUTE + 4_999)
  })

  it('is a minute after the last row when nothing follows', () => {
    expect(stampAfter(T0, Number.POSITIVE_INFINITY)).toBe(T0 + MINUTE)
  })
})

describe('a note dropped above a collapsed group', () => {
  const above = drop(0)

  it('sits under the issue when the group is collapsed', () => {
    expect(rowAt(rows(false), above)).toBe('opened')
  })

  it('still sits under the issue, above the group, once it is expanded', () => {
    expect(rowAt(rows(true), above)).toBe('opened')
  })

  it('does not depend on the labels sharing the issue second', () => {
    expect(stamps[1]).toBeGreaterThan(stamps[0]!)
    expect(above).toBeLessThan(stamps[1]!)
  })
})

describe('a note dropped under a collapsed group', () => {
  const below = drop(2)

  it('sits under the group when it is collapsed', () => {
    expect(rowAt(rows(false), below)).toBe('fold')
  })

  it('sits under the last event of the group once it is expanded', () => {
    expect(rowAt(rows(true), below)).toBe('label-2')
  })

  it('stays above the next event in both states', () => {
    expect(below).toBeLessThan(stamps[3]!)
  })

  it('is told apart from a note dropped above the group', () => {
    expect(rowAt(rows(false), drop(0))).toBe('opened')
    expect(rowAt(rows(false), below)).toBe('fold')
  })
})

describe('a note dropped under the other rows', () => {
  it('sits under the comment, above NOW, in both states', () => {
    for (const open of [false, true]) expect(rowAt(rows(open), drop(3))).toBe('comment')
  })

  it('sits under NOW when dropped after it', () => {
    for (const open of [false, true]) expect(rowAt(rows(open), drop(4))).toBe('now')
  })

  it('sits under the last label of an open group', () => {
    expect(rowAt(rows(true), drop(2))).toBe('label-2')
  })
})

describe('nearestSlot', () => {
  // Four slots 100px apart; the lifted note's footprint is 60px and it came from slot 1.
  const tops = [0, 100, 200, 300]
  const FOOTPRINT = 60
  const ORIGIN = 1

  /** Move the pointer through `ys`, feeding each answer back in as the next target. */
  function follow(ys: number[], start: number): number[] {
    const seen: number[] = []
    let target = start
    for (const y of ys) {
      target = nearestSlot(tops, ORIGIN, target, FOOTPRINT, y)
      seen.push(target)
    }
    return seen
  }

  const down = Array.from({ length: 421 }, (_, i) => i - 10)
  const up = [...down].reverse()

  it('goes to the slot under the pointer', () => {
    expect(nearestSlot(tops, ORIGIN, 1, FOOTPRINT, 0)).toBe(0)
    expect(nearestSlot(tops, ORIGIN, 1, FOOTPRINT, 100)).toBe(1)
  })

  it('never flips back while the pointer keeps moving down', () => {
    const seen = follow(down, 0)
    for (let i = 1; i < seen.length; i += 1) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]!)
    expect(seen.at(-1)).toBe(3)
  })

  it('never flips back while the pointer keeps moving up', () => {
    const seen = follow(up, 3)
    for (let i = 1; i < seen.length; i += 1) expect(seen[i]).toBeLessThanOrEqual(seen[i - 1]!)
    expect(seen.at(-1)).toBe(0)
  })

  it('holds still when the pointer rests', () => {
    const seen = follow(
      Array.from({ length: 30 }, () => 150),
      1,
    )
    expect(new Set(seen).size).toBe(1)
  })
})
