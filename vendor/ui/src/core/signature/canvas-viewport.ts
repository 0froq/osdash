/** A bounded document slice scrolls with its ink even between animation frames. */
export function createCanvasViewport(canvas: HTMLCanvasElement, root: HTMLElement, maxRatio: number) {
  const overscan = 160
  let width = 0
  let height = 0
  let ratio = 0
  let origin = -1

  Object.assign(canvas.style, { position: 'absolute', inset: 'auto', pointerEvents: 'none' })

  function update() {
    const nextWidth = window.innerWidth
    const nextRatio = Math.min(window.devicePixelRatio || 1, maxRatio)
    const nextOrigin = Math.max(0, Math.floor((window.scrollY - overscan) / 64) * 64)
    // Overscan must not extend the document and create more scrollable space.
    const nextHeight = Math.max(1, Math.min(window.innerHeight + overscan * 2, document.body.clientHeight - nextOrigin))
    const changed = width !== nextWidth || height !== nextHeight || ratio !== nextRatio || origin !== nextOrigin
    width = nextWidth
    height = nextHeight
    ratio = nextRatio
    origin = nextOrigin

    // Assigning either bitmap dimension clears the canvas, even if unchanged.
    const pixelsWide = Math.round(width * ratio)
    const pixelsHigh = Math.round(height * ratio)
    if (canvas.width !== pixelsWide)
      canvas.width = pixelsWide
    if (canvas.height !== pixelsHigh)
      canvas.height = pixelsHigh
    const rect = root.getBoundingClientRect()
    canvas.style.left = `${-rect.left - window.scrollX}px`
    canvas.style.top = `${origin - rect.top - window.scrollY}px`
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    return { width, height, ratio, origin, changed }
  }

  return { update }
}
