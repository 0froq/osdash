<script setup lang="ts">
import type { ChoiceOption } from '../../vue'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  nextTick,
  ref,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import { createWheelStep } from '../../core'
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label: string
    options: ChoiceOption[]
    hideLabel?: boolean
    disabled?: boolean
    name?: string
    /** Hold changes while the consumer applies the last one, such as a route change. */
    pending?: boolean
    /** When the wheel changes the value. `hover` also keeps the page still under the pointer. */
    wheel?: 'hover' | 'focus' | 'off'
  }>(),
  { wheel: 'focus' },
)
defineSlots<{ option?: (scope: { option: ChoiceOption }) => unknown }>()

const ROW = 16
/* Rows breathe more once the panel opens — the collapsed window keeps the tight
   16px rhythm so neighbours' slivers stay visible through the mask fade. */
const OPEN_ROW = 24
const model = defineModel<string>({ required: true })
const { wrapperAttrs, controlAttrs } = useControlAttrs()
const id = useId()
const listId = `${id}-list`

const root = useTemplateRef<HTMLElement>('root')
const trigger = useTemplateRef<HTMLElement>('trigger')
const viewport = useTemplateRef<HTMLElement>('viewport')
const open = ref(false)

/* A word too long for the control scrolls to show its whole value while hovered, TableOfContents
   style: JS measures the overflow and drives a keyframed translate through CSS variables. */
function onOptionEnter(event: MouseEvent) {
  const option = event.currentTarget as HTMLElement
  const word = option.querySelector<HTMLElement>('.ui-scroll-select-word')
  if (!word) return
  const overflow = word.scrollWidth - word.clientWidth
  if (overflow <= 0) return
  option.style.setProperty('--scroll-select-marquee-dist', `${overflow + 8}px`)
  option.style.setProperty('--scroll-select-marquee-duration', `${Math.max(1.6, overflow / 40)}s`)
  option.setAttribute('data-marquee', '')
}

function onOptionLeave(event: MouseEvent) {
  const option = event.currentTarget as HTMLElement
  const word = option.querySelector<HTMLElement>('.ui-scroll-select-word')
  option.removeAttribute('data-marquee')
  if (!word) return
  const current = getComputedStyle(word).transform
  word.style.transition = 'none'
  word.style.transform = current === 'none' ? 'translateX(0)' : current
  void word.offsetWidth
  word.style.transition = 'transform .35s var(--ui-ease)'
  word.style.transform = 'translateX(0)'
  window.setTimeout(() => {
    word.style.transition = ''
    word.style.transform = ''
  }, 400)
}

const count = computed(() => props.options.length)
const index = computed(() =>
  Math.max(
    0,
    props.options.findIndex(o => o.value === model.value),
  ),
)
const current = computed(() => props.options[index.value])
const inert = computed(() => props.disabled || count.value < 2)

// Where the list is scrolled to, in px. It moves at once, before the consumer confirms the change.
const shift = ref(index.value * ROW)
const vars = computed(() => ({
  '--scroll-select-shift': `${shift.value}px`,
  '--scroll-select-height': `${Math.min(count.value, 8) * OPEN_ROW + 16}px`,
}))

watch(index, at => {
  shift.value = at * ROW
})
// A change the consumer did not take leaves the list where it was.
watch(
  () => props.pending,
  pending => {
    if (!pending) shift.value = index.value * ROW
  },
)
/* The open list scrolls natively. Hidden overflow keeps the residual scrollTop, which would push
   the centred row out of the band when the list folds back. */
watch(open, () => {
  if (viewport.value) viewport.value.scrollTop = 0
})

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** The nearest enabled option in a direction, or -1 at the end. */
function enabledFrom(from: number, by: number): number {
  for (let at = from + by; at >= 0 && at < count.value; at += by) {
    if (!props.options[at]?.disabled) return at
  }
  return -1
}

function commit(at: number) {
  const option = props.options[at]
  if (!option || option.disabled) return
  shift.value = at * ROW
  if (option.value !== model.value) model.value = option.value
}

function step(by: number): boolean {
  if (open.value || inert.value || props.pending) return false
  const at = enabledFrom(index.value, by)
  if (at === -1) return false
  commit(at)
  return true
}

const gesture = createWheelStep()

function onWheel(event: WheelEvent) {
  if (props.wheel === 'off' || event.ctrlKey || inert.value) return
  if (props.wheel === 'focus' && !root.value?.contains(document.activeElement)) return
  /* Open: the viewport is a real scroller, so let the wheel scroll it instead of stepping. */
  if (open.value) return
  event.preventDefault()
  const unit = event.deltaMode === 1 ? ROW : event.deltaMode === 2 ? ROW * 2 : 1
  const direction = gesture.push(event.deltaY * unit, performance.now())
  if (direction) step(direction)
}

function optionRows() {
  return [...(root.value?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])]
}

async function show() {
  if (inert.value || props.pending) return
  open.value = true
  await nextTick()
  /* The list opens scrolled to the top. Scroll just far enough for the current row to be
     visible: it sits at 6 + index * ROW inside the track's top padding. */
  const view = viewport.value
  if (view) {
    const bottom = 8 + (index.value + 1) * OPEN_ROW
    if (bottom > view.clientHeight) view.scrollTop = bottom - view.clientHeight
  }
  optionRows()[index.value]?.focus({ preventScroll: true })
}

function hide() {
  const active = document.activeElement
  const inside = Boolean(active && active !== trigger.value && root.value?.contains(active))
  open.value = false
  if (inside) trigger.value?.focus({ preventScroll: true })
}

function toggle() {
  if (open.value) hide()
  else void show()
}

function pick(at: number) {
  if (props.options[at]?.disabled) return
  // The window folds back onto the row that was picked.
  commit(at)
  hide()
}

function onKeydown(event: KeyboardEvent) {
  if (!open.value) return
  if (event.key === 'Escape') {
    event.stopPropagation()
    hide()
    return
  }
  const rows = optionRows()
  const at = rows.indexOf(document.activeElement as HTMLElement)
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (at !== -1) pick(at)
    return
  }
  const from = at === -1 ? index.value : at
  const to =
    event.key === 'ArrowDown'
      ? enabledFrom(from, 1)
      : event.key === 'ArrowUp'
        ? enabledFrom(from, -1)
        : event.key === 'Home'
          ? enabledFrom(-1, 1)
          : event.key === 'End'
            ? enabledFrom(count.value, -1)
            : -2
  if (to === -2) return
  event.preventDefault()
  if (to !== -1) rows[to]?.focus({ preventScroll: true })
}

function onFocusout(event: FocusEvent) {
  const next = event.relatedTarget
  if (open.value && next instanceof Node && !root.value?.contains(next)) open.value = false
}

function onOutside(event: PointerEvent) {
  if (open.value && event.target instanceof Node && !root.value?.contains(event.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('pointerdown', onOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside))
</script>

<template>
  <div
    v-bind="wrapperAttrs()"
    class="ui-scroll-select"
  >
    <span
      v-if="!hideLabel"
      :id="`${id}-label`"
      class="ui-scroll-select-label"
      >{{ label }}</span
    >
    <div
      ref="root"
      class="ui-scroll-select-control"
      :class="{ 'is-open': open, 'is-inert': inert }"
      :style="vars"
      @keydown="onKeydown"
      @focusout="onFocusout"
      @wheel="onWheel"
    >
      <button
        v-bind="controlAttrs()"
        :id="id"
        ref="trigger"
        type="button"
        class="ui-scroll-select-trigger"
        :disabled="inert"
        :aria-label="hideLabel ? `${label}: ${current?.label ?? ''}` : undefined"
        :aria-labelledby="hideLabel ? undefined : `${id}-label ${id}`"
        aria-haspopup="listbox"
        :aria-expanded="open"
        :aria-controls="listId"
        :aria-busy="pending || undefined"
        @click="toggle"
        @keydown.up.prevent="step(-1)"
        @keydown.down.prevent="step(1)"
      >
        <!-- Sets the width to the widest option, so the window can float over it. -->
        <span
          class="ui-scroll-select-sizer"
          aria-hidden="true"
        >
          <span
            v-for="option in options"
            :key="option.value"
            class="ui-scroll-select-measure"
          >
            <slot
              name="option"
              :option="option"
              >{{ option.label }}</slot
            >
          </span>
        </span>
      </button>
      <div
        class="ui-scroll-select-window"
        :aria-hidden="open ? undefined : true"
        :inert="open ? undefined : true"
      >
        <div
          ref="viewport"
          class="ui-scroll-select-viewport"
        >
          <ul
            :id="listId"
            class="ui-scroll-select-track"
            role="listbox"
            :aria-label="label"
          >
            <li
              v-for="(option, at) in options"
              :key="option.value"
              class="ui-scroll-select-option"
              :class="{ 'is-current': at === index }"
              role="option"
              tabindex="-1"
              :aria-selected="at === index"
              :aria-disabled="option.disabled || undefined"
              @click="pick(at)"
              @mouseenter="onOptionEnter"
              @mouseleave="onOptionLeave"
            >
              <span class="ui-scroll-select-word">
                <slot
                  name="option"
                  :option="option"
                  >{{ option.label }}</slot
                >
              </span>
            </li>
          </ul>
        </div>
      </div>
      <input
        v-if="name"
        type="hidden"
        :name="name"
        :value="model"
        :disabled="disabled"
      />
    </div>
  </div>
</template>

<style scoped>
/* Registered so the clip and the fade animate with the window instead of snapping. */
@property --scroll-select-fade {
  syntax: '<length>';
  inherits: true;
  initial-value: 0px;
}

@property --scroll-select-clip {
  syntax: '<length>';
  inherits: true;
  initial-value: 0px;
}

.ui-scroll-select {
  display: inline-grid;
  gap: 8px;
  width: max-content;
  max-width: 100%;
  font-family: var(--ui-font-meta);
}

.ui-scroll-select-label {
  color: var(--ui-muted);
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ui-scroll-select-control {
  --scroll-select-shift: 0px;
  --scroll-select-height: 48px;
  --scroll-select-max-width: 18rem;
  --scroll-select-marquee-dist: 0px;
  --scroll-select-marquee-duration: 2.4s;
  position: relative;
  width: max-content;
  max-width: var(--scroll-select-max-width, 18rem);
  height: 32px;
  color: var(--ui-fg);
  font-size: 12px;
  line-height: 16px;
  /* A swipe on the control must not scroll the page. */
  touch-action: none;
  overscroll-behavior: contain;
}

.ui-scroll-select-trigger {
  display: grid;
  align-items: center;
  justify-items: start;
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0 8px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.ui-scroll-select-trigger:disabled {
  color: var(--ui-muted);
  cursor: default;
}

.ui-scroll-select-sizer {
  display: grid;
  min-width: 0;
  overflow: hidden;
  visibility: hidden;
}

.ui-scroll-select-sizer > span {
  grid-area: 1 / 1;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
}

/*
 * The window is 32px, so the current 16px row is centred with half a row either side. At rest the
 * neighbouring halves show through, faded at the edge, which marks the control as a picker.
 */
.ui-scroll-select-window {
  position: absolute;
  z-index: 1;
  inset-inline: 0;
  top: 0;
  height: 32px;
  background-color: transparent;
  box-shadow: 0 0 0 1px transparent;
  pointer-events: none;
  transition:
    height var(--ui-dur) var(--ui-ease),
    background-color var(--ui-dur) var(--ui-ease),
    box-shadow var(--ui-dur) var(--ui-ease);
}

/* Expanded: the top edge stays where it was and the window grows downward. */
.is-open .ui-scroll-select-window {
  height: var(--scroll-select-height);
  background-color: var(--ui-bg);
  box-shadow: 0 0 0 1px var(--ui-line);
  pointer-events: auto;
}

/* A mask, not a colour overlay: the rows fade into whatever is behind the control. */
.ui-scroll-select-viewport {
  --scroll-select-clip: 0px;
  --scroll-select-fade: 8px;
  height: 100%;
  overflow: hidden;
  mask-image: linear-gradient(
    to bottom,
    transparent var(--scroll-select-clip),
    #000 calc(var(--scroll-select-clip) + var(--scroll-select-fade)),
    #000 calc(100% - var(--scroll-select-clip) - var(--scroll-select-fade)),
    transparent calc(100% - var(--scroll-select-clip))
  );
  transition:
    --scroll-select-clip var(--ui-dur) var(--ui-ease),
    --scroll-select-fade var(--ui-dur) var(--ui-ease);
}

.is-open .ui-scroll-select-viewport {
  --scroll-select-clip: 0px;
  --scroll-select-fade: 0px;
  overflow-y: auto;
  overscroll-behavior: contain;
  touch-action: pan-y;
}

.ui-scroll-select-track {
  margin: 0;
  padding: 8px 0;
  list-style: none;
  transform: translateY(calc(-1 * var(--scroll-select-shift)));
  transition: transform var(--ui-dur) var(--ui-ease);
}

.is-open .ui-scroll-select-track {
  transform: none;
}

/*
 * Current: ink instead of muted, and only while the list is open, the Sidebar's accent rule
 * down the row's leading edge over a --ui-fg 6% band, the same fill the Sidebar uses. The rule
 * is 3px, rounded, centred and nudged outward, the same capsule the Sidebar draws. Words are
 * flush at the start edge, collapsed and open, so opening moves nothing sideways.
 */
.ui-scroll-select-option {
  position: relative;
  display: flex;
  align-items: center;
  height: 16px;
  padding: 0 8px;
  overflow: hidden;
  background-color: transparent;
  color: var(--ui-muted);
  white-space: nowrap;
  cursor: pointer;
  transition:
    height var(--ui-dur) var(--ui-ease),
    padding var(--ui-dur) var(--ui-ease),
    color var(--ui-dur) var(--ui-ease),
    background-color var(--ui-dur) var(--ui-ease);
}

/* Open: the rows relax to the roomier list rhythm, the same density the
   floating lists in Menu/Select use. */
.is-open .ui-scroll-select-option {
  height: 24px;
  padding: 0 10px;
}

.ui-scroll-select-word {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* A word too long for the control scrolls to show its whole value while hovered, the way
   TableOfContents does: JS measures the overflow into --scroll-select-marquee-dist and
   -duration, and a keyframed translate plays it back and forth. */
.is-open .ui-scroll-select-option[data-marquee] .ui-scroll-select-word {
  overflow: visible;
  animation: scroll-select-marquee var(--scroll-select-marquee-duration, 2.4s) ease-in-out infinite
    alternate;
}

@keyframes scroll-select-marquee {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(calc(-1 * var(--scroll-select-marquee-dist, 0px)));
  }
}

.is-open .ui-scroll-select-option.is-current::before {
  content: '';
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 0;
  width: 3px;
  height: 10px;
  border-radius: 1px;
  background: var(--ui-accent);
  transform: translate(-30%, -50%);
}

.ui-scroll-select-option.is-current {
  color: var(--ui-fg);
}

.is-open .ui-scroll-select-option.is-current {
  background-color: color-mix(in srgb, var(--ui-fg) 6%, transparent);
}

.ui-scroll-select-option[aria-disabled='true'] {
  opacity: 0.5;
  cursor: default;
}

.is-open .ui-scroll-select-option:hover:not([aria-disabled='true']),
.ui-scroll-select-option:focus-visible {
  color: var(--ui-fg);
}

.ui-scroll-select-option:focus-visible {
  outline: none;
}

.ui-scroll-select-trigger:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: -2px;
}

@media (prefers-reduced-motion: reduce) {
  .ui-scroll-select-window,
  .ui-scroll-select-viewport,
  .ui-scroll-select-track,
  .ui-scroll-select-option,
  .ui-scroll-select-option::before,
  .ui-scroll-select-word {
    transition: none;
  }
}
</style>
