import type { Ref } from 'vue'
import type { InkMark, LayerColors, MixColors, PaperLayer, PenAnchors, PenLayer, PenOptions } from '../core/signature/types'
import { onBeforeUnmount, onMounted, readonly, shallowReactive } from 'vue'
import { createInkWash } from '../core/signature/paper'
import { createPenStroke } from '../core/signature/pen'
import { settled } from '../core/signature/settle'

export interface PaperSignatureSettings {
  paper?: boolean
  bloom?: boolean
  line?: boolean
  hand?: boolean
  dwellAfter?: number
  click?: boolean
}

export interface PaperSignatureOptions {
  /** Resolved after fonts and content settle. Settings stay fixed for this mount. */
  settings?: () => PaperSignatureSettings
  anchors: () => PenAnchors & { mark?: HTMLElement | null }
  /** Six-digit HEX paper, ink and accent colors. */
  colors: () => LayerColors
  mixColors: MixColors
  /** Draw over time. Off paints the finished ink. Reduced motion also finishes it. Default true. */
  animate?: boolean
  /** Tremor on rules and travel. Default true. */
  tremor?: boolean
  /** Curve a sharp join. Default true. */
  roundJoins?: boolean
  /** Fade the connecting route toward the paper. Default true. */
  fadeRoute?: boolean
  /** After a tagline, keep the page route. Off leaves the tagline as its own ink. Default true. */
  continuePastHand?: boolean
  /** Section names. Default `ring`. */
  labels?: PenOptions['labels']
  /** Latin marks drawn apart from the page route. */
  marks?: () => InkMark[]
}

export interface PaperSignatureState {
  paper: boolean
  bloom: boolean
  stroke: boolean
  hand: boolean
}

/** One page-level signature. The caller owns layout, text, colors and visibility. */
export function usePaperSignature(root: Ref<HTMLElement | undefined>, options: PaperSignatureOptions) {
  const state = shallowReactive<PaperSignatureState>({ paper: false, bloom: false, stroke: false, hand: false })
  let paper: PaperLayer | null = null
  let pen: PenLayer | null = null
  const timers: ReturnType<typeof setTimeout>[] = []
  let alive = true

  function setColors(colors = options.colors()): void {
    paper?.setColors(colors)
    pen?.setColors(colors)
  }

  onMounted(async () => {
    const el = root.value
    if (!el)
      return
    await Promise.all([document.fonts.ready, settled(el)])
    if (!alive)
      return
    const settings = options.settings?.() ?? {}
    const { mark, finalMark, rule } = options.anchors()
    const bloom = settings.bloom ?? true
    const line = (settings.line ?? true) && !!rule
    if (settings.paper ?? true) {
      paper = createInkWash({
        colors: options.colors(),
        marks: bloom ? [mark, line ? null : finalMark].filter((m): m is HTMLElement => !!m) : [],
        washes: bloom,
        dwellAfter: settings.dwellAfter ?? 0,
        click: settings.click ?? false,
      })
    }
    state.paper = !!paper
    state.bloom = !!paper && bloom
    if (state.bloom)
      timers.push(setTimeout(() => paper?.bloom(), 250))
    if (line) {
      timers.push(setTimeout(() => {
        const anchors = (): PenAnchors => {
          const next = options.anchors()
          return { ...next, hand: (settings.hand ?? true) ? next.hand : null }
        }
        pen = createPenStroke({
          root: el,
          anchors,
          mixColors: options.mixColors,
          onReady: (hand) => {
            state.stroke = true
            state.hand = hand
          },
          colors: options.colors(),
          wet: (x, y) => paper?.wet(x, y) ?? 0,
          flowing: () => paper?.flowing() ?? false,
          onArrive: state.bloom && finalMark ? () => paper?.soak(finalMark) : undefined,
          animate: options.animate,
          tremor: options.tremor,
          roundJoins: options.roundJoins,
          fadeRoute: options.fadeRoute,
          continuePastHand: options.continuePastHand,
          labels: options.labels,
          marks: options.marks,
        })
        state.stroke = !!pen
      }, 900))
    }
  })

  onBeforeUnmount(() => {
    alive = false
    timers.forEach(clearTimeout)
    paper?.destroy()
    pen?.destroy()
    Object.assign(state, { paper: false, bloom: false, stroke: false, hand: false })
  })

  return { state: readonly(state), setColors }
}
