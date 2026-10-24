/** Paper tooth for one container. Light is fibre. Dark is specks. */

export type PaperMode = 'light' | 'dark' | 'off'

export interface PaperSlice {
  width: number
  height: number
  docX: number
  docY: number
  paper: readonly [number, number, number]
  mode: PaperMode
}

interface FibreSheet {
  canvas: HTMLCanvasElement
  image: ImageData
  cols: number
  rows: number
  originX: number
  originY: number
  tone: number
}

const STEP = 3

function hash(x: number, y: number): number {
  let px = x * 123.34
  let py = y * 456.21
  px -= Math.floor(px)
  py -= Math.floor(py)
  const dot = px * (px + 45.32) + py * (py + 45.32)
  px += dot
  py += dot
  const n = px * py
  return n - Math.floor(n)
}

function noise(x: number, y: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  let fx = x - ix
  let fy = y - iy
  fx = fx * fx * (3 - 2 * fx)
  fy = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy)
  const b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1)
  const d = hash(ix + 1, iy + 1)
  const ab = a + (b - a) * fx
  const cd = c + (d - c) * fx
  return ab + (cd - ab) * fy
}

function fbm(x: number, y: number): number {
  let v = 0
  let a = 0.5
  for (let i = 0; i < 5; i += 1) {
    v += a * noise(x, y)
    const nx = 1.6 * x + 1.2 * y + 7.3
    const ny = -1.2 * x + 1.6 * y + 7.3
    x = nx
    y = ny
    a *= 0.5
  }
  return v
}

function fibreAt(x: number, y: number): number {
  const fib = fbm(x * 0.09, y * 0.03) * 0.5 + fbm(x * 0.03 + 9, y * 0.09 + 9) * 0.5
  const tooth = noise(x * 0.8, y * 0.8) * 0.6 + noise(x * 2.1, y * 2.1) * 0.4
  return (fib - 0.5) * 0.03 + (tooth - 0.5) * 0.022
}

function speckTile(): HTMLCanvasElement {
  const tile = 160
  const spec = document.createElement('canvas')
  spec.width = tile
  spec.height = tile
  const grain = spec.getContext('2d')
  if (!grain)
    return spec
  const image = grain.createImageData(tile, tile)
  const pixels = image.data
  for (let i = 0; i < pixels.length; i += 4) {
    const n = Math.random()
    const speck = n > 0.965 || n < 0.035
    pixels[i] = 242
    pixels[i + 1] = 240
    pixels[i + 2] = 234
    pixels[i + 3] = speck ? 12 : 0
  }
  grain.putImageData(image, 0, 0)
  return spec
}

function writeFibre(pixels: Uint8ClampedArray, cols: number, row0: number, row1: number, originX: number, originY: number, paper: readonly [number, number, number]): void {
  const tone = (paper[0] + paper[1] + paper[2]) / 3
  const room = 255 - tone
  for (let row = row0; row < row1; row += 1) {
    const docY = originY + row * STEP
    let i = row * cols * 4
    for (let col = 0; col < cols; col += 1) {
      const g = fibreAt(originX + col * STEP, docY)
      if (g >= 0) {
        const alpha = room > 0 ? Math.min(255, (tone * g * 255) / room) : 0
        pixels[i] = 255
        pixels[i + 1] = 255
        pixels[i + 2] = 255
        pixels[i + 3] = alpha
      }
      else {
        pixels[i] = 0
        pixels[i + 1] = 0
        pixels[i + 2] = 0
        pixels[i + 3] = Math.min(255, -g * 255)
      }
      i += 4
    }
  }
}

export interface PaperPaint {
  draw: (canvas: HTMLCanvasElement, slice: PaperSlice) => void
  destroy: () => void
}

export function createPaperPaint(): PaperPaint {
  let specks: HTMLCanvasElement | null = null
  let fibre: FibreSheet | null = null

  function drawFibre(ctx: CanvasRenderingContext2D, slice: PaperSlice): void {
    const { width, height, docX, docY, paper } = slice
    const originX = Math.floor(docX / STEP) * STEP
    const originY = Math.floor(docY / STEP) * STEP
    const cols = Math.ceil((width + STEP) / STEP)
    const rows = Math.ceil((height + STEP) / STEP)
    const tone = (paper[0] + paper[1] + paper[2]) / 3
    if (!fibre || fibre.cols !== cols || fibre.rows !== rows || fibre.tone !== tone) {
      const canvas = document.createElement('canvas')
      canvas.width = cols
      canvas.height = rows
      const grain = canvas.getContext('2d')
      if (!grain)
        return
      const image = grain.createImageData(cols, rows)
      writeFibre(image.data, cols, 0, rows, originX, originY, paper)
      grain.putImageData(image, 0, 0)
      fibre = { canvas, image, cols, rows, originX, originY, tone }
    }
    else if (fibre.originX !== originX || fibre.originY !== originY) {
      const shift = Math.round((originY - fibre.originY) / STEP)
      const sameX = fibre.originX === originX
      const grain = fibre.canvas.getContext('2d')
      if (!grain)
        return
      if (sameX && Math.abs(shift) < rows && Math.abs(originY - fibre.originY - shift * STEP) < 0.5) {
        const stride = cols * 4
        if (shift > 0)
          fibre.image.data.copyWithin(0, shift * stride, rows * stride)
        else
          fibre.image.data.copyWithin(-shift * stride, 0, (rows + shift) * stride)
        const row0 = shift > 0 ? rows - shift : 0
        const row1 = shift > 0 ? rows : -shift
        writeFibre(fibre.image.data, cols, row0, row1, originX, originY, paper)
      }
      else {
        writeFibre(fibre.image.data, cols, 0, rows, originX, originY, paper)
      }
      grain.putImageData(fibre.image, 0, 0)
      fibre.originX = originX
      fibre.originY = originY
    }
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(fibre.canvas, originX - docX, originY - docY, cols * STEP, rows * STEP)
  }

  function draw(canvas: HTMLCanvasElement, slice: PaperSlice): void {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const bw = Math.max(1, Math.floor(slice.width * ratio))
    const bh = Math.max(1, Math.floor(slice.height * ratio))
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw
      canvas.height = bh
    }
    const ctx = canvas.getContext('2d')
    if (!ctx)
      return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, slice.width, slice.height)
    if (slice.mode === 'off')
      return
    if (slice.mode === 'light') {
      drawFibre(ctx, slice)
      return
    }
    specks ??= speckTile()
    const pattern = ctx.createPattern(specks, 'repeat')
    if (!pattern)
      return
    ctx.save()
    ctx.translate(-slice.docX, -slice.docY)
    ctx.globalAlpha = 0.85
    ctx.fillStyle = pattern
    ctx.fillRect(slice.docX, slice.docY, slice.width, slice.height)
    ctx.restore()
  }

  function destroy(): void {
    specks = null
    fibre = null
  }

  return { draw, destroy }
}
