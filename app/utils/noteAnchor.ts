/**
 * Where a note sits is a time. It goes after the last row that is not newer than
 * its anchor, so every rule here is about keeping that comparison honest.
 */

/** A minute after a row reads as "after it" without anyone typing a time. */
const STEP = 60_000

/**
 * Event times with ties broken in story order: each is at least a millisecond
 * after the one before. GitHub stamps events to the second, so an issue and the
 * labels added with it often share a time, and no anchor can sit between two
 * events that share one. Run over every event, folded ones included, so a
 * collapsed and an open timeline agree on every stamp.
 */
export function breakTies(times: readonly number[]): number[] {
  let last = Number.NEGATIVE_INFINITY
  return times.map(time => {
    last = Math.max(time, last + 1)
    return last
  })
}

/**
 * The anchor for a note dropped right after the event at `prev`: a minute
 * later, but always below `next`, the next event in the story whether or not it
 * is on screen. A stamp at or past `next` would land the note one event too far,
 * and inside a group that is folded away right now.
 */
export function stampAfter(prev: number, next: number): number {
  return Math.max(prev, Math.min(prev + STEP, next - 1))
}

/** The row a note sits under: the last timed row not newer than it, else the first. */
export function rowAt(
  timed: ReadonlyArray<{ id: string; time: number }>,
  stamp: number,
): string | undefined {
  let target = timed[0]?.id
  for (const entry of timed) {
    if (entry.time <= stamp) target = entry.id
    else break
  }
  return target
}

/**
 * Which slot the pointer is at while a note is being dragged. `tops` are the
 * slots' tops measured once at pick-up. The user is looking at a different
 * layout: the lifted note has left its place (every slot after `origin` moved
 * up by one `footprint`) and a gap has opened at `target` (every slot after it
 * moved down by one). Reading the pointer against that shifted layout is what
 * keeps the gap from chasing the pointer back and forth across a boundary; the
 * frozen layout has no such margin and flickers.
 */
export function nearestSlot(
  tops: readonly number[],
  origin: number,
  target: number,
  footprint: number,
  y: number,
): number {
  let best = target
  let bestDistance = Number.POSITIVE_INFINITY
  tops.forEach((top, index) => {
    const shifted = top - (index > origin ? footprint : 0) + (index > target ? footprint : 0)
    const distance = Math.abs(shifted - y)
    if (distance < bestDistance) {
      best = index
      bestDistance = distance
    }
  })
  return best
}
