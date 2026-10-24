export type Point = [number, number]

/**
 * Clockwise from the upper left; ends at the bottom heading left, so the pen leaves
 * towards the margin instead of crossing back over what it circled.
 */
export function looseEllipse(cx: number, cy: number, rx: number, ry: number, start = -2.0, end = Math.PI * 2.5): Point[] {
  const pts: Point[] = []
  const n = Math.round((end - start) * 20)
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = start + t * (end - start)
    const k = 1 + (t - 0.5) * 0.1
    const x = Math.cos(a) * rx * k
    const y = Math.sin(a) * ry * k
    const tilt = -0.06
    pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)])
  }
  return pts
}

export function toPath(points: Point[]): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point[0].toFixed(2)} ${point[1].toFixed(2)}`)
    .join(' ')
}
