// Stroke: the whole page is one sentence written with a single pen line.
// It handwrites the tagline (if the page has one), rules off the page head, threads through
// the empty label column, circles the price and ends on the final full stop.
// A narrow page has no margin, so a written tagline is the whole sentence.
// The caller supplies semantic anchor elements; content determines the route.

import type { InkMark, LayerColors, PenLayer, PenOptions, Point } from './types'
import { prefersReducedMotion } from '../motion'
import { createCanvasViewport } from './canvas-viewport'
import { layoutText } from './hand-font'
import { cubic, looseEllipse, resample, roundJoin, simplify, smooth, STEP, tangent, wobble } from './pen-geometry'

interface Seg {
  from: number
  to: number
  speed: number
  trigger: Element | null
  scroll: boolean
}

interface Dot {
  x: number
  y: number
  r: number
}

interface TravelOpts {
  speed: number
  trigger?: Element | null
  taper?: boolean
  nib?: boolean
  /** Travel connects the intentional marks without competing with them. */
  emphasis?: boolean
  /** Reveal a connector only as its points enter the reading area. */
  scroll?: boolean
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// `onArrive` hands the final full stop to another layer instead of stamping a flat dot
export function createPenStroke(options: PenOptions): PenLayer | null {
  const { root, onArrive, wet, flowing, mixColors: blend } = options
  const initialAnchors = options.anchors()
  const textEl = initialAnchors.hand ?? null
  const raw = (initialAnchors.handText ?? textEl?.textContent ?? '').trim()
  const hand = raw.length > 0 ? textEl : null
  const text = hand ? raw.replace(/[.!?]$/, '') : ''
  const reduced = prefersReducedMotion() || options.animate === false
  const labels = options.labels ?? 'ring'
  const canvas = document.createElement('canvas')
  canvas.className = 'ui-pen-layer'
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '-1', pointerEvents: 'none' })
  // Inside the page's stacking context, under its type: it fades out with the page it belongs to
  root.prepend(canvas)
  const viewport = createCanvasViewport(canvas, root, 2)
  const ctx2d = canvas.getContext('2d')
  if (!ctx2d) {
    canvas.remove()
    return null
  }
  const ctx: CanvasRenderingContext2D = ctx2d
  options.onReady?.(!!hand)

  let ink = options.colors.ink
  let accent = options.colors.accent
  const ROUTE_WEIGHT = 0.24
  const ROUTE_FADE = 32
  let paper = options.colors.paper
  let inkAt: string[] = []
  let accentAt: string[] = []
  const probes: HTMLElement[] = []
  let destroyed = false
  let raf = 0
  let resizeTimer = 0
  let layoutObserver: ResizeObserver | undefined

  let X = new Float32Array()
  let Y = new Float32Array()
  let Wd = new Float32Array()
  let Tone = new Float32Array()
  let stainAt = new Float64Array()
  let segs: Seg[] = []
  let total = 0
  let head = 0
  let segIndex = 0
  let dot: Dot | null = null
  let dotBorn = 0
  let wordWidth = 1.6
  let dirty = true
  // Dye stays long after the wash has gone, then eases back to ink
  const DYE_HOLD = 70
  const DYE_FADE = 36
  let wake = Number.POSITIVE_INFINITY

  // Box of the text itself, not of the (possibly grid-stretched) element
  function textRect(el: Element): DOMRect {
    const range = document.createRange()
    range.selectNodeContents(el)
    return range.getBoundingClientRect()
  }

  function baseline(el: Element): number {
    let probe = el.querySelector(':scope > .ui-pen-probe')
    if (!probe) {
      const created = document.createElement('i')
      created.className = 'ui-pen-probe'
      Object.assign(created.style, { display: 'inline-block', width: '0', height: '0', verticalAlign: 'baseline' })
      el.append(created)
      probes.push(created)
      probe = created
    }
    return probe.getBoundingClientRect().top + window.scrollY
  }

  function build(): void {
    const anchors = options.anchors()
    const pts: Point[] = []
    const widths: number[] = []
    const emphases: number[] = []
    const draft: (Seg | null)[] = []
    let pen: Point | null = null
    let dir: Point = [1, 0]
    dot = null
    let sized = false
    const tremble = (pts: Point[], amp: number, seed: number): Point[] => options.tremor === false ? pts : wobble(pts, amp, seed)

    const append = (poly: Point[], w: number, opts: TravelOpts): Seg => {
      const { speed, trigger = null, taper = false, nib = false, emphasis = true, scroll = false } = opts
      const joined = pen ? (options.roundJoins === false ? poly : roundJoin(pen, dir, poly)) : poly
      const r = resample(joined)
      const from = pts.length
      r.forEach((p, i) => {
        if (from > 0 && i === 0)
          return
        pts.push(p)
        const k = taper ? Math.min(1, i / 24, (r.length - 1 - i) / 24) : 1
        let ww = w * (0.45 + 0.55 * k)
        if (nib) {
          // Pointed pen: downstrokes swell, hairlines on the way up
          const a = r[Math.max(0, i - 2)]!
          const b = r[Math.min(r.length - 1, i + 2)]!
          const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
          ww *= 0.32 + 1.1 * Math.max(0, (b[1] - a[1]) / l) ** 1.4
        }
        widths.push(ww)
        emphases.push(emphasis ? 1 : 0)
      })
      pen = r[r.length - 1] ?? pen
      dir = tangent(r, true)
      return { from, to: pts.length - 1, speed, trigger, scroll }
    }
    // Before anything is drawn the first travel just puts the pen down
    const travel = (to: Point, entry: Point, w?: number, opts?: TravelOpts): Seg | null => {
      if (!pen) {
        pen = to
        dir = entry
        return null
      }
      const d = Math.hypot(to[0] - pen[0], to[1] - pen[1])
      return append(tremble(cubic(pen, dir, to, entry, Math.max(20, Math.round(d / 6))), Math.min(6, d * 0.012), to[1] * 0.01), w ?? 0, { ...opts, speed: opts?.speed ?? 0, emphasis: false, scroll: !!opts?.trigger })
    }

    // Latin ink fitted to a box. `lifted` starts a new mark instead of joining the route.
    const writeLatin = (source: string, left: number, baselineY: number, fitWidth: number, trigger: Element | null, lifted: boolean): void => {
      const probeSize = 100
      const sample = layoutText(source, { size: probeSize })
      if (sample.width <= 0 || fitWidth <= 0)
        return
      const size = probeSize * fitWidth / sample.width
      const ww = Math.max(1.4, Math.min(3.4, size * 0.028))
      if (!sized) {
        wordWidth = ww
        sized = true
      }
      const scale = ww / wordWidth
      if (lifted)
        pen = null
      const glyphs = layoutText(source, { size }).strokes.map(s => smooth(simplify(s.map(([x, y]): Point => [x + left, y + baselineY]), size * 0.006)))
      glyphs.forEach((g, k) => {
        const start = g[0]
        if (!start)
          return
        let len = 0
        for (let i = 1; i < g.length; i++) {
          const prev = g[i - 1]!
          const next = g[i]!
          len += Math.hypot(next[0] - prev[0], next[1] - prev[1])
        }
        const isDot = len < size * 0.1
        // Between strokes the pen stays on the paper but barely touches it; it heads
        // straight for a dot rather than looping into the dot's own direction
        if (k > 0 && pen) {
          const dx = start[0] - pen[0]
          const dy = start[1] - pen[1]
          const l = Math.hypot(dx, dy) || 1
          draft.push(append(cubic(pen, dir, start, isDot ? [dx / l, dy / l] : tangent(g, false), 40), 0.07 * scale, { speed: size * 9, emphasis: false, trigger }))
        }
        draft.push(append(g, (isDot ? 1.5 : 1) * scale, { speed: size * (isDot ? 2 : 6), nib: !isDot, trigger }))
      })
    }

    const placeMark = (mark: InkMark): void => {
      const raw = mark.stripStop ? mark.text.replace(/[.!?]$/, '') : mark.text
      const source = raw.trim()
      if (!source)
        return
      const el = mark.element
      if (el) {
        const rect = textRect(el)
        writeLatin(source, rect.left, baseline(el), rect.width, el, true)
        return
      }
      const box = mark.box
      if (!box)
        return
      writeLatin(source, box.x, box.baseline, box.width, null, true)
    }

    // 1. The tagline, handwritten into the box of the (hidden) typeset one
    if (hand) {
      const rect = textRect(hand)
      writeLatin(text, rect.left, baseline(hand), rect.width, null, false)
    }
    const connector = 1.2 / wordWidth
    // Single-column layouts have no margin to run in. A written tagline ends the stroke;
    // otherwise the pen still lifts between sections.
    const narrow = window.innerWidth < 860
    const lift = (to: Point, trigger: Element): Seg | null => pen ? append([pen, to], 0, { speed: 1e6, trigger }) : travel(to, [1, 0])

    // A tagline can be the whole stroke. The route below is the rest of the page.
    if (!(narrow && hand) && (options.continuePastHand !== false || !hand)) {
      // 2. The rule under the head of the page, drawn right to left.
      // Stop to the right of the first label, leaving room for the leftward
      // tangent to turn down without swinging out to the page edge.
      const foot = anchors.rule
      if (foot) {
        const fr = foot.getBoundingClientRect()
        const y = fr.top + window.scrollY
        const end = anchors.ruleEnd ? textRect(anchors.ruleEnd) : null
        let x0 = fr.right
        let x1 = fr.left
        if (end) {
          x0 = end.right
          x1 = end.left
        }
        else {
          const firstLabel = !narrow ? anchors.sections?.find(section => section.label)?.label : undefined
          if (firstLabel) {
            const lr = textRect(firstLabel)
            x1 = Math.min(fr.right - 32, Math.max(fr.left + 32, lr.right + 32))
          }
        }
        draft.push(travel([x0, y], [-0.45, 0.9], connector, { speed: 1100 }))
        draft.push(append(tremble([[x0, y], [x1, y]], 1.2, 3), connector * 0.8, { speed: 1800, emphasis: false }))
      }

      // 3. Mark each section name; prices get their own ring.
      anchors.sections?.forEach(({ label, price }) => {
        if (!label)
          return
        const lr = textRect(label)
        switch (labels) {
          case 'ring': {
            const labelCx = lr.left + lr.width / 2
            const labelCy = lr.top + window.scrollY + lr.height / 2
            // Grow across the turns so they read as pen passes rather than one thick outline.
            const labelRing = looseEllipse(labelCx, labelCy, lr.width / 2 + 12, lr.height / 2 + 10, -2, Math.PI * 2.5, 0.3)
            const labelStart = labelRing[0]
            if (!labelStart)
              return
            draft.push(narrow ? lift(labelStart, label) : travel(labelStart, tangent(labelRing, false), connector, { speed: 1600, trigger: label }))
            draft.push(append(labelRing, connector * 1.05, { speed: 700, trigger: label }))
            break
          }
          case 'line': {
            const y = lr.bottom + window.scrollY + 5
            const start: Point = [lr.left - 2, y]
            draft.push(narrow ? lift(start, label) : travel(start, [0.25, 0.97], connector, { speed: 1600, trigger: label }))
            draft.push(append(tremble([start, [lr.right + 18, y - 1.5]], 0.8, y), connector * 1.15, { speed: 700, trigger: label }))
            break
          }
          default: {
            const _labels: never = labels
            void _labels
          }
        }

        if (!price)
          return
        const pr = textRect(price)
        const cx = pr.left + pr.width / 2
        const cy = pr.top + window.scrollY + pr.height * 0.55
        const ring = looseEllipse(cx, cy, pr.width * 0.62, pr.height * 0.5)
        const ringStart = ring[0]
        if (!ringStart)
          return
        draft.push(narrow ? lift(ringStart, price) : travel(ringStart, tangent(ring, false), connector, { speed: 1600, trigger: price }))
        draft.push(append(ring, connector * 1.25, { speed: 1100, trigger: price }))
      })

      // 4. The full stop
      const mark = anchors.finalMark
      const section = anchors.finalSection ?? null
      const parent = mark?.parentElement ?? null
      const measure = mark ? document.createElement('canvas').getContext('2d') : null
      const glyphText = mark?.textContent
      if (mark && section && parent && measure && glyphText != null) {
        const style = getComputedStyle(mark)
        measure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
        const t = measure.measureText(glyphText)
        const mr = mark.getBoundingClientRect()
        const b = baseline(mark)
        const c: Point = [mr.left + (t.actualBoundingBoxRight - t.actualBoundingBoxLeft) / 2, b + (t.actualBoundingBoxDescent - t.actualBoundingBoxAscent) / 2]
        const r = Math.max(t.actualBoundingBoxRight + t.actualBoundingBoxLeft, t.actualBoundingBoxAscent + t.actualBoundingBoxDescent) / 2
        // Down the margin, across the empty band above the last section, then into the stop
        // from the upper right so the line never crosses text
        const prev = section.previousElementSibling?.getBoundingClientRect()
        const top = section.getBoundingClientRect().top
        const bandY = (prev ? (prev.bottom + top) / 2 : top) + window.scrollY
        const title = textRect(parent)
        const left = anchors.margin?.getBoundingClientRect().left ?? 40
        // A caller-owned empty band beside the stop: run down the gutter outside the text,
        // cross the band, and drop onto the stop from its right.
        const band = anchors.finalBand?.getBoundingClientRect()
        const over: Point = band
          ? [Math.min(window.innerWidth - 24, c[0] + title.height * 0.3), band.top + band.height / 2 + window.scrollY]
          : [Math.min(window.innerWidth - 40, c[0] + title.height * 1.1), title.top + window.scrollY - title.height * 0.9]
        if (band) {
          // Right along the band, straight down past the stop, then left into it:
          // three square-ish turns with a radius no larger than the stop's gap to the edge.
          const gap = Math.max(12, Math.min(over[0] - c[0], (c[1] - over[1]) / 2.5))
          const turn: Point = [over[0] - gap, over[1]]
          if (narrow) {
            draft.push(lift(turn, section))
            dir = [1, 0]
          }
          else {
            const laneX = Math.max(12, band.left - 28)
            draft.push(travel([laneX, top + window.scrollY + 24], [0, 1], connector, { speed: 1500, trigger: section }))
            draft.push(travel([laneX, over[1]], [0.2, 0.98], connector, { speed: 1500, trigger: section }))
            draft.push(travel(turn, [1, 0], connector, { speed: 1500, trigger: section }))
          }
          draft.push(travel([over[0], over[1] + gap], [0, 1], connector, { speed: 1100, trigger: mark }))
          draft.push(travel([over[0], c[1] - gap], [0, 1], connector, { speed: 1500, trigger: mark }))
          draft.push(travel(c, [-1, 0], connector, { speed: 1100, trigger: mark }))
        }
        else {
          if (narrow) {
            draft.push(lift(over, section))
            dir = [0.86, 0.5]
          }
          else {
            draft.push(travel([left + 24, bandY], [0.2, 0.98], connector, { speed: 1500, trigger: section }))
            draft.push(travel(over, [0.86, 0.5], connector, { speed: 1500, trigger: section }))
          }
          draft.push(travel(c, [-0.42, 0.91], connector, { speed: 1100, trigger: mark }))
        }
        dot = { x: c[0], y: c[1], r }
      }
    }

    if (pts.length)
      sized = true
    for (const mark of options.marks?.() ?? [])
      placeMark(mark)

    segs = draft.filter((seg): seg is Seg => seg !== null)
    total = pts.length
    X = new Float32Array(total)
    Y = new Float32Array(total)
    Wd = new Float32Array(total)
    Tone = new Float32Array(total).fill(1)
    stainAt = new Float64Array(total)
    wake = Number.POSITIVE_INFINITY
    pts.forEach(([x, y], i) => {
      X[i] = x
      Y[i] = y
      Wd[i] = widths[i] ?? 0
    })
    const distance = new Float64Array(total)
    for (let i = 1; i < total; i++)
      distance[i] = distance[i - 1]! + Math.hypot(X[i]! - X[i - 1]!, Y[i]! - Y[i - 1]!)
    // Fade on the connecting route, leaving the intentional marks at full strength.
    if (options.fadeRoute !== false) {
      for (let start = 0; start < total;) {
        if (emphases[start]) {
          start++
          continue
        }
        let end = start + 1
        while (end < total && !emphases[end])
          end++
        const enters = start > 0 && widths[start - 1]! > 0
        const leaves = end < total ? widths[end]! > 0 : !!dot
        const from = distance[Math.max(0, start - 1)]!
        const to = distance[Math.min(total - 1, end)]!
        for (let i = start; i < end; i++) {
          const entry = enters ? 1 - smoothstep(0, ROUTE_FADE, distance[i]! - from) : 0
          const exit = leaves ? 1 - smoothstep(0, ROUTE_FADE, to - distance[i]!) : 0
          Tone[i] = ROUTE_WEIGHT + (1 - ROUTE_WEIGHT) * Math.max(entry, exit)
        }
        start = end
      }
    }
    recolor()
  }

  function recolor(): void {
    inkAt = Array.from(Tone, weight => weight === 1 ? ink : blend(ink, weight, paper))
    accentAt = Array.from(Tone, weight => weight === 1 ? accent : blend(accent, weight, paper))
  }

  let dpr = 1
  let W = 0
  let H = 0
  let origin = 0
  function resize(): void {
    const slice = viewport.update()
    dpr = slice.ratio
    W = slice.width
    H = slice.height
    origin = slice.origin
    dirty ||= slice.changed
  }

  function rebuild(): void {
    const done = segIndex
    const current = segs[done]
    const progress = current ? Math.max(0, Math.min(1, (head - current.from) / Math.max(1, current.to - current.from))) : 0
    const finished = head >= total - 1 && total > 0
    build()
    segIndex = Math.min(done, segs.length)
    const prev = segs[segIndex - 1]
    const next = segs[segIndex]
    head = finished ? total - 1 : next ? next.from + (next.to - next.from) * progress : prev?.to ?? 0
    dirty = true
  }

  let last = performance.now()
  let started = 0
  let revealEdge = window.scrollY + window.innerHeight * 0.8

  function triggered(seg: Seg): boolean {
    return !seg.trigger || seg.trigger.getBoundingClientRect().top < window.innerHeight * 0.8
  }

  function advance(dt: number): void {
    if (reduced) {
      if (head < total - 1) {
        head = total - 1
        segIndex = segs.length
        arrive(performance.now() - 1000)
        dirty = true
      }
      return
    }
    // Let the reading boundary trail the scroll, then settle without overshoot.
    // At the very bottom nothing more can scroll into view, so the whole viewport counts as read.
    const atBottom = document.documentElement.scrollHeight - window.innerHeight - window.scrollY < 2
    const readingEdge = window.scrollY + window.innerHeight * (atBottom ? 1 : 0.8)
    revealEdge += (readingEdge - revealEdge) * (1 - Math.exp(-dt / 0.22))
    if (Math.abs(readingEdge - revealEdge) < 0.5)
      revealEdge = readingEdge
    let budget = dt
    while (segIndex < segs.length && budget > 0) {
      const seg = segs[segIndex]
      if (!seg || (!seg.scroll && !triggered(seg)))
        break
      // If the reader has run ahead, the pen hurries to catch up
      let ahead = 0
      for (let k = segIndex + 1; k < segs.length && triggered(segs[k]!); k++) {
        if (segs[k]!.trigger)
          ahead++
      }
      const rate = (seg.speed / STEP) * (1 + ahead * 0.6)
      let target = Math.min(seg.to, head + rate * budget)
      if (seg.scroll) {
        const edge = revealEdge
        // Stop at the first crossing, including a fractional sample, so bends
        // cannot reveal an unseen stretch just because their endpoint is visible.
        for (let i = Math.floor(head) + 1; i <= Math.ceil(target); i++) {
          const y = Y[i]!
          if (y <= edge)
            continue
          const before = Y[i - 1]!
          const crossing = before < edge ? i - 1 + (edge - before) / (y - before) : head
          target = Math.max(head, Math.min(target, crossing))
          break
        }
      }
      if (target <= head)
        break
      budget -= (target - head) / rate
      head = target
      dirty = true
      if (head >= seg.to) {
        segIndex++
      }
      else {
        break
      }
    }
    if (segIndex >= segs.length && dot && !dotBorn)
      arrive(performance.now())
  }

  function arrive(at: number): void {
    dotBorn = at
    onArrive?.()
  }

  function draw(now: number): boolean {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = ink
    const sy = origin
    const y0 = sy - 60
    const y1 = sy + H + 60
    const upto = Math.floor(head)
    const CH = 3
    const doc = (i: number): [number, number] => [X[i] ?? 0, Y[i] ?? 0]
    const hidden = (i: number, j: number): boolean => {
      const yi = Y[i] ?? 0
      const yj = Y[j] ?? 0
      return (yi < y0 && yj < y0) || (yi > y1 && yj > y1)
    }
    const dyeOf = (i: number): number => {
      const at = stainAt[i] ?? 0
      if (at <= 0)
        return 0
      const since = (now - at) / 1000
      if (since <= DYE_HOLD)
        return 1
      return 1 - smoothstep(DYE_HOLD, DYE_HOLD + DYE_FADE, since)
    }
    const gradient = (from: Point, to: Point, first: string, last: string): string | CanvasGradient => {
      if (first === last || (from[0] === to[0] && from[1] === to[1]))
        return first
      const color = ctx.createLinearGradient(from[0], from[1] - sy, to[0], to[1] - sy)
      color.addColorStop(0, first)
      color.addColorStop(1, last)
      return color
    }
    const stroke = (i: number, j: number, width: number, colors: string[], alpha: number): void => {
      const [x, y] = doc(i)
      ctx.beginPath()
      ctx.moveTo(x, y - sy)
      for (let k = i + 1; k <= j; k++) {
        const [px, py] = doc(k)
        ctx.lineTo(px, py - sy)
      }
      ctx.globalAlpha = alpha
      ctx.strokeStyle = gradient(doc(i), doc(j), colors[i]!, colors[j]!)
      ctx.lineWidth = width
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.strokeStyle = ink
    }
    for (let i = 0; i < upto;) {
      const w = Wd[i + 1] ?? 0
      let j = i + 1
      while (j < upto && j - i < CH && Math.abs((Wd[j + 1] ?? 0) - w) < w * 0.35)
        j++
      if (w > 0 && !hidden(i, j))
        stroke(i, j, wordWidth * w, inkAt, 1)
      if (wet) {
        for (let k = i; k < j; k++) {
          const [x, y] = doc(k)
          if (wet(x, y) > 0.2)
            stainAt[k] = now
        }
      }
      i = j
    }
    let next = Number.POSITIVE_INFINITY
    let fading = false
    for (let i = 0; i < upto;) {
      const dye = dyeOf(i)
      const at = stainAt[i] ?? 0
      if (at > 0) {
        const fadeAt = at + DYE_HOLD * 1000
        if (now >= fadeAt && now < fadeAt + DYE_FADE * 1000)
          fading = true
        else if (now < fadeAt && fadeAt < next)
          next = fadeAt
      }
      let j = i + 1
      while (j < upto && j - i < CH && Math.abs(dyeOf(j) - dye) < 0.06)
        j++
      const w = Wd[j] ?? Wd[i + 1] ?? 0
      if (dye > 0.02 && w > 0 && !hidden(i, j))
        stroke(i, j, wordWidth * w, accentAt, dye)
      i = j
    }
    wake = fading ? now : next
    // Fractional tip and the nib
    // A pen resting where a lift put it leaves no mark until it moves
    const tipW = Wd[upto + 1] ?? 0
    if (upto < total - 1 && tipW > 0 && head > upto) {
      const f = head - upto
      const weight = Tone[upto]! + (Tone[upto + 1]! - Tone[upto]!) * f
      const tipInk = blend(ink, weight, paper)
      const x0 = X[upto] ?? 0
      const yAt = Y[upto] ?? 0
      const hx = x0 + ((X[upto + 1] ?? 0) - x0) * f
      const hy = yAt + ((Y[upto + 1] ?? 0) - yAt) * f - sy
      ctx.strokeStyle = gradient(doc(upto), [hx, hy + sy], inkAt[upto]!, tipInk)
      ctx.beginPath()
      ctx.moveTo(x0, yAt - sy)
      ctx.lineTo(hx, hy)
      ctx.lineWidth = wordWidth * (Wd[upto] ?? 0)
      ctx.stroke()
      const current = segs[segIndex]
      if (head > 0 && segIndex < segs.length && current && (current.scroll || triggered(current))) {
        ctx.fillStyle = tipInk
        ctx.beginPath()
        ctx.arc(hx, hy, wordWidth * (Wd[upto] ?? 0) * 0.9, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    if (dot && dotBorn && !onArrive) {
      // Ease-out-back: the nib presses, the ink spreads slightly past, then settles
      const t = Math.min(1, (now - dotBorn) / 420)
      const s = 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2
      const r = dot.r * Math.max(0, s)
      if (r > 0) {
        ctx.fillStyle = accent
        ctx.beginPath()
        ctx.arc(dot.x, dot.y - sy, r, 0, Math.PI * 2)
        ctx.fill()
      }
      return t < 1
    }
    return false
  }

  function frame(now: number): void {
    if (destroyed)
      return
    resize()
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!started)
      started = now
    if (now - started > 500)
      advance(dt)
    if (destroyed)
      return
    if (flowing?.() || now >= wake)
      dirty = true
    if (dirty || (dot && dotBorn && now - dotBorn < 500)) {
      draw(now)
      dirty = false
    }
    if (!destroyed)
      raf = requestAnimationFrame(frame)
  }

  function setColors(colors: LayerColors): void {
    if (destroyed)
      return
    ink = colors.ink
    accent = colors.accent
    paper = colors.paper
    recolor()
    dirty = true
  }

  function destroy(): void {
    if (destroyed)
      return
    destroyed = true
    cancelAnimationFrame(raf)
    window.clearTimeout(resizeTimer)
    layoutObserver?.disconnect()
    for (const probe of probes)
      probe.remove()
    canvas.remove()
  }

  resize()
  build()
  // Browser chrome changes the visible height during scrolling, not the route.
  let layoutWidth = root.clientWidth
  let layoutHeight = root.clientHeight
  layoutObserver = new ResizeObserver(() => {
    if (root.clientWidth === layoutWidth && root.clientHeight === layoutHeight)
      return
    layoutWidth = root.clientWidth
    layoutHeight = root.clientHeight
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(rebuild, 120)
  })
  layoutObserver.observe(root)
  raf = requestAnimationFrame(frame)

  return { setColors, destroy }
}
