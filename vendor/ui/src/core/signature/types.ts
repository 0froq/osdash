import type { Point } from '../pen'

export type { Point } from '../pen'

/** A caller-owned color mixer. Weight is the proportion of the first color. */
export type MixColors = (first: string, weight: number, second: string) => string

export interface PenAnchors {
  rule?: Element | null
  /** The head rule spans this text instead of running the width of `rule`. */
  ruleEnd?: Element | null
  hand?: HTMLElement | null
  /** Text without layout placeholders; defaults to hand.textContent. */
  handText?: string
  sections?: { element: Element, label: Element, price?: Element | null }[]
  finalMark?: HTMLElement | null
  finalSection?: Element | null
  /** An empty horizontal band level with `finalMark`'s section, spanning its text column. The pen crosses it instead of descending the margin, so a stop inside a text-filled block is reached without crossing words. */
  finalBand?: Element | null
  margin?: Element | null
}

export interface LayerColors {
  paper: string
  ink: string
  accent: string
  dark: boolean
}

export interface PaperOptions {
  colors: LayerColors
  /** Elements whose centre receives a wash when `bloom()` runs. */
  marks?: HTMLElement[]
  /** Punctuation washes. Off leaves the stops as type. */
  washes?: boolean
  /** Seconds of stillness before a dwell wash. `0` listens for nothing. */
  dwellAfter?: number
  /** A press drops a wash. Off ignores clicks. */
  click?: boolean
}

export interface BloomOptions {
  delay?: number
  strength?: number
}

export interface PaperLayer {
  bloom: () => void
  soak: (el: HTMLElement | null | undefined) => void
  add: (x: number, y: number, size: number, options?: BloomOptions) => void
  /** 0–1 wash coverage at a document point. The pen dyes the stroke there. */
  wet: (x: number, y: number) => number
  /** A wash is still on the page, so the pen should redraw through it. */
  flowing: () => boolean
  setColors: (colors: LayerColors) => void
  destroy: () => void
}

/**
 * A free-standing Latin mark. The pen lifts before it, so it is not a continuation
 * of the page route. The hand font covers digits, A–Z, a–z, and
 * `.,'!?-:$():/`. Any other character advances by a space and leaves no stroke.
 */
export interface InkMark {
  text: string
  /** Fit the writing to this element's own text box. */
  element?: HTMLElement | null
  /** Document box when there is no element. `baseline` is the writing line. */
  box?: { x: number, baseline: number, width: number }
  /** Drop one trailing `.` `!` or `?`. The page tagline still does this on its own. */
  stripStop?: boolean
}

export interface PenOptions {
  /** Positioned page root; the pen canvas shares its stacking context. */
  root: HTMLElement
  /** Re-read anchors when the actual content layout changes. */
  anchors: () => PenAnchors
  mixColors: MixColors
  /** Runs synchronously before measuring; hide/position the typeset fallback here. */
  onReady?: (hand: boolean) => void
  colors: LayerColors
  /** Wash coverage at a document point. Covered ink is dyed. */
  wet?: (x: number, y: number) => number
  /** True while a wash is still spreading, so newly dyed ink gets redrawn. */
  flowing?: () => boolean
  /** Called when the pen reaches the final mark. Without it the pen dots the stop itself. */
  onArrive?: () => void
  /**
   * Draw the ink over time. Off paints the finished stroke.
   * Reduced motion also paints it finished. Default true.
   */
  animate?: boolean
  /** Tremor on rules and travel. Default true. */
  tremor?: boolean
  /** Curve a sharp join. Default true. */
  roundJoins?: boolean
  /** Fade the connecting route toward the paper. Default true. */
  fadeRoute?: boolean
  /**
   * After a handwritten tagline, keep ruling and marking the page.
   * Off leaves that tagline as its own ink. Default true.
   */
  continuePastHand?: boolean
  /** Section names. `ring` circles them. `line` underlines them. Default `ring`. */
  labels?: 'ring' | 'line'
  /**
   * Latin marks drawn apart from the page route. Re-read on layout.
   * Omit them and the route is unchanged.
   */
  marks?: () => InkMark[]
}

export interface PenLayer {
  setColors: (colors: LayerColors) => void
  destroy: () => void
}

export interface GlyphLayout {
  strokes: Point[][]
  width: number
  ascent: number
  descent: number
}
