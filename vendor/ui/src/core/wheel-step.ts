export interface WheelStepOptions {
  /** Events closer together than this belong to one gesture, inertia included. */
  quiet?: number
  /** A swipe is new when it rises above the quietest event since inertia began by this factor. */
  rise?: number
  /** And by at least this much, so the last small events of a tail never count as a swipe. */
  riseBy?: number
}

/**
 * Turn a stream of wheel deltas into steps of exactly one item per gesture, however far or fast
 * the gesture scrolls, and however long it lasts. A gesture ends on a pause, on a reversal, or
 * when a fresh swipe rises out of decaying inertia. Nothing else ends it, not even time, so one
 * long scroll never becomes several steps.
 *
 * `push` returns the direction to step (-1 or 1), or 0 when the event belongs to a gesture that
 * already stepped. A step the caller could not apply is not retried from the same gesture. The
 * user pauses, reverses, or swipes again.
 */
export function createWheelStep(options: WheelStepOptions = {}) {
  const { quiet = 120, rise = 2, riseBy = 8 } = options
  let held = false
  let last = 0
  let direction = 0
  let peak = 0
  let decaying = false
  let floor = 0

  function push(delta: number, time: number): -1 | 0 | 1 {
    const next = Math.sign(delta)
    if (!next) return 0
    const size = Math.abs(delta)
    if (held) {
      if (size < peak * 0.8 && !decaying) {
        decaying = true
        floor = size
      } else if (decaying) {
        floor = Math.min(floor, size)
      }
      const fresh =
        time - last > quiet || next !== direction || (decaying && size > floor * rise + riseBy)
      peak = Math.max(peak, size)
      last = time
      if (!fresh) return 0
    }
    last = time
    held = true
    direction = next
    peak = size
    decaying = false
    floor = size
    return next < 0 ? -1 : 1
  }

  return { push }
}
