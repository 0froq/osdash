export interface ScrollBounds {
  top: number
  height: number
  viewport: number
}

export type ScrollOwner = 'inner' | 'outer'

/** Lock wheel ownership until a pause or direction reversal starts a new gesture. */
export function createScrollGesture(idle = 180) {
  let last = Number.NEGATIVE_INFINITY
  let direction = 0
  let owner: ScrollOwner = 'inner'

  function reset() {
    last = Number.NEGATIVE_INFINITY
    direction = 0
    owner = 'inner'
  }

  function route(delta: number, time: number, bounds: ScrollBounds): ScrollOwner {
    const next = Math.sign(delta)
    if (!next)
      return owner
    if (time - last >= idle || next !== direction) {
      const bottom = Math.max(0, bounds.height - bounds.viewport)
      const outside = next < 0 ? bounds.top <= 1 : bounds.top >= bottom - 1
      owner = outside ? 'outer' : 'inner'
    }
    last = time
    direction = next
    return owner
  }

  return { route, reset }
}
