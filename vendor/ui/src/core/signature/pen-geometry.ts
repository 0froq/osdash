import type { Point } from './types'

export const STEP = 2.5

// Ramer–Douglas–Peucker: recover the font's key vertices before re-smoothing
export function simplify(pts: Point[], eps: number): Point[] {
  if (pts.length < 3)
    return pts
  const a = pts[0]!
  const b = pts[pts.length - 1]!
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  let max = 0
  let idx = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]!
    const d = Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len
    if (d > max) {
      max = d
      idx = i
    }
  }
  if (max <= eps)
    return [a, b]
  return [...simplify(pts.slice(0, idx + 1), eps).slice(0, -1), ...simplify(pts.slice(idx), eps)]
}

// Centripetal Catmull-Rom through the font's key points, so any size stays smooth
export function smooth(pts: Point[], per = 8): Point[] {
  if (pts.length < 3)
    return pts
  const out: Point[] = []
  const first = pts[0]!
  const last = pts[pts.length - 1]!
  const P = [first, ...pts, last]
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1]!
    const p1 = P[i]!
    const p2 = P[i + 1]!
    const p3 = P[i + 2]!
    const d = (a: Point, b: Point): number => Math.max(1e-4, Math.hypot(b[0] - a[0], b[1] - a[1]) ** 0.5)
    const t1 = d(p0, p1)
    const t2 = t1 + d(p1, p2)
    const t3 = t2 + d(p2, p3)
    for (let j = 0; j < per; j++) {
      const t = t1 + ((t2 - t1) * j) / per
      const lerp = (a: Point, b: Point, ta: number, tb: number): Point => [
        ((tb - t) * a[0] + (t - ta) * b[0]) / (tb - ta),
        ((tb - t) * a[1] + (t - ta) * b[1]) / (tb - ta),
      ]
      const A1 = lerp(p0, p1, 0, t1)
      const A2 = lerp(p1, p2, t1, t2)
      const A3 = lerp(p2, p3, t2, t3)
      const B1 = lerp(A1, A2, 0, t2)
      const B2 = lerp(A2, A3, t1, t3)
      out.push(lerp(B1, B2, t1, t2))
    }
  }
  out.push(last)
  return out
}

export function resample(poly: Point[], step = STEP): Point[] {
  const first = poly[0]!
  const out: Point[] = [first]
  let carry = 0
  for (let i = 1; i < poly.length; i++) {
    const prev = poly[i - 1]!
    const next = poly[i]!
    const ax = prev[0]
    const ay = prev[1]
    const bx = next[0]
    const by = next[1]
    const len = Math.hypot(bx - ax, by - ay)
    let d = step - carry
    while (d <= len) {
      const k = d / len
      out.push([ax + (bx - ax) * k, ay + (by - ay) * k])
      d += step
    }
    carry = len - (d - step)
  }
  const last = poly[poly.length - 1]!
  const end = out[out.length - 1]!
  if (Math.hypot(end[0] - last[0], end[1] - last[1]) > 0.5)
    out.push(last)
  return out
}

export function cubic(p0: Point, t0: Point, p3: Point, t3: Point, n = 80): Point[] {
  const d = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) || 1
  const chord: Point = [(p3[0] - p0[0]) / d, (p3[1] - p0[1]) / d]
  // A tangent that already aims at the target keeps a long handle. One that
  // disagrees turns on a short radius instead of kinking or swinging wide.
  const handle = (t: Point): number => {
    const aim = Math.max(0, t[0] * chord[0] + t[1] * chord[1])
    return Math.min(d * 0.4, 150) * (0.32 + 0.68 * aim)
  }
  const m0 = handle(t0)
  const m3 = handle(t3)
  const p1: Point = [p0[0] + t0[0] * m0, p0[1] + t0[1] * m0]
  const p2: Point = [p3[0] - t3[0] * m3, p3[1] - t3[1] * m3]
  const pts: Point[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = (1 - t) ** 3
    const b = 3 * (1 - t) ** 2 * t
    const c = 3 * (1 - t) * t * t
    const e = t ** 3
    pts.push([a * p0[0] + b * p1[0] + c * p2[0] + e * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + e * p3[1]])
  }
  return pts
}

// Low-frequency hand tremor, perpendicular to the path, fading at both ends
export function wobble(pts: Point[], amp: number, seed: number): Point[] {
  const out: Point[] = []
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)]!
    const next = pts[Math.min(pts.length - 1, i + 1)]!
    const cur = pts[i]!
    const tx = next[0] - prev[0]
    const ty = next[1] - prev[1]
    const tl = Math.hypot(tx, ty) || 1
    if (i > 0) {
      const before = pts[i - 1]!
      s += Math.hypot(cur[0] - before[0], cur[1] - before[1])
    }
    const k = Math.sin((i / (pts.length - 1)) * Math.PI)
    const off = amp * k * (Math.sin(s * 0.006 + seed) * 0.65 + Math.sin(s * 0.017 + seed * 2.3) * 0.35)
    out.push([cur[0] - (ty / tl) * off, cur[1] + (tx / tl) * off])
  }
  return out
}

// Clockwise from the upper left; ends at the bottom heading left, so the pen leaves
// towards the margin instead of crossing back over what it circled
export function looseEllipse(cx: number, cy: number, rx: number, ry: number, start = -2.0, end = Math.PI * 2.5, spread = 0.1): Point[] {
  const pts: Point[] = []
  const n = Math.round((end - start) * 20)
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = start + t * (end - start)
    const k = 1 + (t - 0.5) * spread
    const x = Math.cos(a) * rx * k
    const y = Math.sin(a) * ry * k
    const tilt = -0.06
    pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)])
  }
  return pts
}

// A sharp join is redrawn as one curve through the whole run, so a ruled line
// leaves along the pen and arrives along itself instead of staying dead straight.
export function roundJoin(origin: Point, tIn: Point, poly: Point[]): Point[] {
  const last = poly[poly.length - 1]
  const head = poly[Math.min(poly.length - 1, 3)]
  if (!last || !head || poly.length < 2)
    return poly
  const span = Math.hypot(last[0] - origin[0], last[1] - origin[1])
  if (span < 10)
    return poly
  const hx = head[0] - poly[0]![0]
  const hy = head[1] - poly[0]![1]
  const hl = Math.hypot(hx, hy) || 1
  if (tIn[0] * hx / hl + tIn[1] * hy / hl > 0.84)
    return poly
  const reach = Math.min(46, Math.max(18, span * 0.28))
  let walked = 0
  let idx = 1
  for (; idx < poly.length; idx++) {
    const p = poly[idx]!
    const q = poly[idx - 1]!
    walked += Math.hypot(p[0] - q[0], p[1] - q[1])
    if (walked >= reach)
      break
  }
  idx = Math.min(idx, poly.length - 1)
  const at = poly[idx]!
  const before = poly[Math.max(0, idx - 1)]!
  const tl = Math.hypot(at[0] - before[0], at[1] - before[1]) || 1
  const tOut: Point = [(at[0] - before[0]) / tl, (at[1] - before[1]) / tl]
  const arc = cubic(origin, tIn, at, tOut, 16)
  return [...arc.slice(0, -1), ...poly.slice(idx)]
}

export function tangent(pts: Point[], atEnd: boolean): Point {
  const a = atEnd ? pts[pts.length - 4] || pts[0] : pts[0]
  const b = atEnd ? pts[pts.length - 1] : pts[3] || pts[pts.length - 1]
  if (!a || !b)
    return [1, 0]
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]
}
