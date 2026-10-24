// Pigment: paper, and optionally watercolour on it. The page stays grey; the only colour is
// one bloom standing in for the brand's full stop, and whatever the visitor leaves behind.
// With `washes: false` the stops stay type. Dwell and click are separate.
// Each bloom soaks outward through a fixed paper-noise field, so its edge grows ragged the
// way a real wash does, with pigment gathering at the rim.

import type { BloomOptions, LayerColors, PaperLayer, PaperOptions } from './types'
import { prefersReducedMotion } from '../motion'
import { createCanvasViewport } from './canvas-viewport'

const MAX = 40

const VERT = `#version 300 es
in vec2 p;
out vec2 uv;
void main() {
  uv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`

const FRAG = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 o;
uniform vec2 uRes;
uniform float uScroll;
uniform vec3 uPaper;
uniform vec3 uAccent;
uniform float uDark;
uniform vec4 uA[${MAX}];
uniform vec4 uB[${MAX}];
uniform int uCount;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p + 7.3;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  vec2 doc = px + vec2(0.0, uScroll);

  float tooth = noise(doc * 0.8) * 0.6 + noise(doc * 2.1) * 0.4;

  float dens = 0.0;
  for (int i = 0; i < ${MAX}; i++) {
    if (i >= uCount) break;
    vec4 a = uA[i]; // x, y (document px), radius, seed
    vec4 b = uB[i]; // strength, alpha, wetness, unused
    vec2 dv = doc - a.xy;
    float r = max(a.z, 0.001);
    float d = length(dv) / r;
    if (d > 1.6) continue;

    // Ragged front: the paper decides where the water reaches
    vec2 q = doc * max(0.03, 1.4 / r) + a.w;
    vec2 warp = vec2(fbm(q), fbm(q + 5.2)) - 0.5;
    float field = d + (fbm(q + warp * 1.8) - 0.5) * 0.55 + (noise(doc * 0.12 + a.w) - 0.5) * 0.08;
    if (field > 1.05) continue;

    float inside = 1.0 - smoothstep(0.97, 1.02, field);
    float rim = exp(-pow((1.0 - field) / 0.045, 2.0)) * inside;
    float wash = mix(0.55, 1.0, smoothstep(0.2, 0.95, field)) * (0.7 + 0.6 * fbm(doc * 0.05 + a.w * 3.0));
    float gran = mix(mix(0.55, 1.45, tooth), 1.0, uDark);
    float rimTooth = mix(0.8 + 0.4 * tooth, 1.0, uDark);

    dens += b.y * b.x * (inside * wash * 0.42 * gran + rim * 0.55 * rimTooth);
  }

  // Light paper absorbs through the wash; on dark mode we skip the gritty paper texture entirely
  // and render clean, luminous diffusion that glows softly against the deep ground
  vec3 absorb = (1.0 - uAccent) + 0.05;
  vec3 wet = uPaper * exp(-absorb * dens);
  vec3 lit = mix(uPaper, uAccent, 1.0 - exp(-dens * 1.6));
  vec3 col = mix(wet, lit, uDark);
  o = vec4(col, 1.0);
}`

interface Bloom {
  x: number
  y: number
  size: number
  strength: number
  tau: number
  life: number
  hold: boolean
  born: number
  seed: number
}

interface GlyphBox {
  cx: number
  cy: number
  r: number
}

interface Mark {
  el: HTMLElement
  probe: HTMLElement | null
  glyph: GlyphBox | null
  bloom: Bloom | null
  visible: boolean
  visibleAt: number
  now: boolean
}

type WashOptions = BloomOptions & {
  tau?: number
  life?: number
  hold?: boolean
}

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function toMark(el: HTMLElement): Mark {
  return { el, probe: null, glyph: null, bloom: null, visible: false, visibleAt: 0, now: false }
}

export function createInkWash(options: PaperOptions): PaperLayer | null {
  const { colors, marks: mark = [], washes = true, dwellAfter = 0, click = false } = options
  const reduced = prefersReducedMotion()

  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '0', pointerEvents: 'none' })
  const glContext = canvas.getContext('webgl2', { alpha: false, antialias: false })
  if (!glContext)
    return null
  const gl: WebGL2RenderingContext = glContext
  document.body.prepend(canvas)
  const viewport = createCanvasViewport(canvas, document.body, 1.5)
  let dirty = true
  let destroyed = false
  let raf = 0
  const ac = new AbortController()
  const { signal } = ac

  function compile(type: number, src: string): WebGLShader {
    const sh = gl.createShader(type)
    if (!sh)
      throw new Error('shader')
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(sh) ?? 'shader')
    return sh
  }
  const prog = gl.createProgram()
  if (!prog)
    throw new Error('program')
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
  gl.bindAttribLocation(prog, 0, 'p')
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(prog) ?? 'program')
  gl.useProgram(prog)
  const u = (name: string): WebGLUniformLocation | null => gl.getUniformLocation(prog, name)
  const U = {
    res: u('uRes'),
    scroll: u('uScroll'),
    paper: u('uPaper'),
    accent: u('uAccent'),
    dark: u('uDark'),
    a: u('uA'),
    b: u('uB'),
    count: u('uCount'),
  }
  function setColors(theme: LayerColors): void {
    if (destroyed)
      return
    gl.uniform3fv(U.paper, hexToRgb(theme.paper))
    gl.uniform3fv(U.accent, hexToRgb(theme.accent))
    gl.uniform1f(U.dark, theme.dark ? 1 : 0)
    dirty = true
  }
  setColors(colors)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  let W = 0
  let H = 0
  let origin = 0
  function resize(): void {
    const slice = viewport.update()
    W = slice.width
    H = slice.height
    origin = slice.origin
    dirty ||= slice.changed
  }

  // A bloom: soaks from 0 to `size` with time constant `tau`, then dries and fades unless held
  const blooms: Bloom[] = []
  function spawn(x: number, y: number, size: number, opts: WashOptions = {}): Bloom {
    const { strength = 1, tau = 0.8, life = 14, hold = false } = opts
    if (blooms.length >= MAX)
      blooms.splice(blooms.findIndex(b => !b.hold), 1)
    const b: Bloom = { x, y: y + window.scrollY, size, strength, tau, life, hold, born: performance.now(), seed: Math.random() * 100 }
    blooms.push(b)
    dirty = true
    return b
  }
  function add(x: number, y: number, size: number, opts?: BloomOptions): void {
    if (destroyed)
      return
    spawn(x, y, size, opts)
  }

  // Punctuation marks that turn into held blooms the first time they are fully seen
  const marks: Mark[] = washes ? mark.filter(el => !!el).map(toMark) : []
  function measureMarks(): void {
    for (const m of marks) {
      if (!m.probe) {
        m.probe = document.createElement('i')
        Object.assign(m.probe.style, { display: 'inline-block', width: '0', height: '0', verticalAlign: 'baseline' })
        m.el.append(m.probe)
      }
      const style = getComputedStyle(m.el)
      const ctx = document.createElement('canvas').getContext('2d')
      if (!ctx)
        continue
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      // SSR slot anchors may be the first child. Element text excludes those comments.
      const t = ctx.measureText(m.el.textContent || '.')
      m.glyph = {
        cx: (t.actualBoundingBoxRight - t.actualBoundingBoxLeft) / 2,
        cy: (t.actualBoundingBoxDescent - t.actualBoundingBoxAscent) / 2,
        r: Math.max(t.actualBoundingBoxRight + t.actualBoundingBoxLeft, t.actualBoundingBoxAscent + t.actualBoundingBoxDescent) / 2,
      }
    }
  }
  function centre(m: Mark): { x: number, y: number, r: number } {
    const glyph = m.glyph
    const probe = m.probe
    if (!glyph || !probe)
      return { x: 0, y: 0, r: 0 }
    return { x: m.el.getBoundingClientRect().left + glyph.cx, y: probe.getBoundingClientRect().top + glyph.cy, r: glyph.r }
  }
  let armed = false
  function bloom(): void {
    if (destroyed)
      return
    armed = true
  }
  // Bloom a mark right away, e.g. when another layer's pen lands on it
  function soak(el: HTMLElement | null | undefined): void {
    if (destroyed || !el)
      return
    let m = marks.find(item => item.el === el)
    if (!m) {
      m = toMark(el)
      marks.push(m)
      measureMarks()
    }
    m.now = true
    dirty = true
  }
  const seen = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const m = marks.find(item => item.el === entry.target)
      if (m && entry.isIntersecting)
        m.visible = true
    }
  }, { threshold: 1 })
  marks.forEach(m => seen.observe(m.el))

  // Resting the pointer lets colour bleed from the tip; a press drops a bead of colour
  let tip: { x: number, y: number, still: number, paper: boolean } | null = null
  let dwellBloom: Bloom | null = null
  const onPaper = (event: Event): boolean => {
    const target = event.target
    return !(target instanceof Element && target.closest('a, button, summary'))
  }
  if (dwellAfter > 0) {
    window.addEventListener('pointermove', (event) => {
      const x = event.clientX
      const y = event.clientY
      if (!tip || Math.hypot(x - tip.x, y - tip.y) > 4) {
        tip = { x, y, still: performance.now(), paper: onPaper(event) }
        dwellBloom = null
      }
    }, { passive: true, signal })
    document.addEventListener('mouseleave', () => {
      tip = null
      dwellBloom = null
    }, { signal })
  }
  if (click) {
    window.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || !onPaper(event))
        return
      spawn(event.clientX, event.clientY, 22 + Math.random() * 16, { strength: 1, tau: reduced ? 0.001 : 0.6 })
    }, { passive: true, signal })
  }

  function dwell(now: number): void {
    if (!tip || !tip.paper || reduced || dwellAfter <= 0)
      return
    const held = (now - tip.still) / 1000
    if (held < dwellAfter)
      return
    if (!dwellBloom)
      dwellBloom = spawn(tip.x, tip.y, 6, { strength: 0.75, tau: 1.6, life: 12 })
    dwellBloom.size = Math.min(58, 6 + (held - dwellAfter) * 9)
    dwellBloom.born = Math.min(dwellBloom.born, now)
    dwellBloom.life = 12 + held
  }

  const A = new Float32Array(MAX * 4)
  const B = new Float32Array(MAX * 4)

  function wet(x: number, y: number): number {
    const now = performance.now()
    let cover = 0
    for (const b of blooms) {
      const t = (now - b.born) / 1000
      const alpha = b.hold ? 1 : 1 - smoothstep(b.life, b.life + 8, t)
      if (alpha <= 0)
        continue
      const radius = Math.max(b.size * (1 - Math.exp(-t / b.tau)), 1)
      const d = Math.hypot(x - b.x, y - b.y) / radius
      if (d > 1.05)
        continue
      cover += b.strength * alpha * (1 - smoothstep(0.82, 1.02, d))
    }
    return Math.min(1, cover)
  }

  function flowing(): boolean {
    const now = performance.now()
    return blooms.some((b) => {
      const t = (now - b.born) / 1000
      const alpha = b.hold ? 1 : 1 - smoothstep(b.life, b.life + 8, t)
      if (alpha <= 0)
        return false
      const growing = 1 - Math.exp(-t / b.tau) < 0.98
      return growing || !b.hold
    })
  }

  function frame(now: number): void {
    if (destroyed)
      return
    resize()
    dwell(now)

    for (const m of marks) {
      if (((armed && m.visible) || m.now) && !m.bloom && m.glyph) {
        // Let the reader settle on the line before the colour arrives
        m.visibleAt ||= now
        if (m.now || now - m.visibleAt > 450) {
          const c = centre(m)
          m.bloom = spawn(c.x, c.y, c.r * 1.2, { strength: 3, tau: reduced ? 0.001 : 1.1, hold: true })
        }
      }
      if (m.bloom) {
        const c = centre(m)
        if (m.bloom.x !== c.x || m.bloom.y !== c.y + window.scrollY || m.bloom.size !== c.r * 1.2)
          dirty = true
        m.bloom.x = c.x
        m.bloom.y = c.y + window.scrollY
        m.bloom.size = c.r * 1.2
      }
    }

    let animating = false
    let n = 0
    for (let i = blooms.length - 1; i >= 0; i--) {
      const b = blooms[i]!
      const t = (now - b.born) / 1000
      const alpha = b.hold ? 1 : 1 - smoothstep(b.life, b.life + 8, t)
      if (alpha <= 0) {
        blooms.splice(i, 1)
        continue
      }
      const grow = 1 - Math.exp(-t / b.tau)
      if (grow < 0.999 || alpha < 1)
        animating = true
      A.set([b.x, b.y, b.size * grow, b.seed], n * 4)
      B.set([b.strength, alpha, 0, 0], n * 4)
      n++
    }

    if (animating || dirty || dwellBloom) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(U.res, W, H)
      gl.uniform1f(U.scroll, origin)
      gl.uniform4fv(U.a, A)
      gl.uniform4fv(U.b, B)
      gl.uniform1i(U.count, n)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      dirty = false
    }
    if (!destroyed)
      raf = requestAnimationFrame(frame)
  }

  function destroy(): void {
    if (destroyed)
      return
    destroyed = true
    cancelAnimationFrame(raf)
    ac.abort()
    seen.disconnect()
    for (const m of marks)
      m.probe?.remove()
    canvas.remove()
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }

  resize()
  measureMarks()
  window.addEventListener('resize', () => {
    resize()
    measureMarks()
  }, { signal })
  raf = requestAnimationFrame(frame)

  return { bloom, soak, add, wet, flowing, setColors, destroy }
}
