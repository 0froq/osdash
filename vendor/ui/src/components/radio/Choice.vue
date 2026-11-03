<script setup lang="ts" generic="T extends string">
import type { ChoiceOption } from '../../vue'
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, useId, watch } from 'vue'
import { prefersReducedMotion } from '../../core'
import { useChoice } from '../../vue'

interface Rule {
  left: number
  top: number
  width: number
}

const props = defineProps<{
  options: ChoiceOption<T>[]
  label?: string
  disabled?: boolean
}>()
const model = defineModel<T>({ required: true })

const labelId = useId()
const { values, signature, isDisabled, tabindex, onKeydown } = useChoice(
  () => props.options,
  model,
  () => props.disabled ?? false,
)

const words: HTMLElement[] = []
const optionsRow = ref<HTMLElement>()
const mark = ref<HTMLElement>()
const rest = reactive({ x: 0, y: 0, w: 0 })
const placed = ref(false)
let motion: Animation | undefined
let disposed = false

function wordOf(value: T): HTMLElement | undefined {
  return (
    words[values.value.indexOf(value)]?.querySelector<HTMLElement>('.ui-choice-word-text') ??
    undefined
  )
}

/* Measure the span inside the button, relative to the options row, so the rule hugs the word
   rather than the taller padded button. `left`/`width` may be overridden with absolute row
   coordinates for the stretched frame. */
function measure(word: HTMLElement, left?: number, width?: number): Rule {
  const box = optionsRow.value?.getBoundingClientRect()
  const rect = word.getBoundingClientRect()
  return {
    left: left ?? rect.left - (box?.left ?? 0),
    top: rect.bottom - (box?.top ?? 0) + 3,
    width: width ?? rect.width,
  }
}

function current(el: HTMLElement): Rule {
  const style = getComputedStyle(el)
  return {
    left: el.offsetLeft,
    top: el.offsetTop,
    width: Number.parseFloat(style.width) || el.offsetWidth,
  }
}

function frame(rule: Rule, offset: number, easing: string): Keyframe {
  return {
    left: `${rule.left}px`,
    top: `${rule.top}px`,
    width: `${rule.width}px`,
    offset,
    easing,
  }
}

function settle(): void {
  const word = wordOf(model.value)
  if (!word) {
    placed.value = false
    return
  }
  const rule = measure(word)
  rest.x = rule.left
  rest.y = rule.top
  rest.w = rule.width
  placed.value = true
}

function travel(from: T, to: T): void {
  const el = mark.value
  const a = wordOf(from)
  const b = wordOf(to)
  if (!el || !a || !b) {
    settle()
    return
  }
  const start = motion?.playState === 'running' ? current(el) : measure(a)
  motion?.cancel()
  settle()
  if (prefersReducedMotion()) return
  const left = Math.min(measure(a).left, measure(b).left)
  const right = Math.max(measure(a).left + measure(a).width, measure(b).left + measure(b).width)
  motion = el.animate(
    [
      frame(start, 0, 'cubic-bezier(0.5, 0, 0.75, 0)'),
      frame(measure(b, left, right - left), 0.46, 'cubic-bezier(0.16, 1, 0.3, 1)'),
      frame(measure(b), 1, 'cubic-bezier(0.7, 0, 0.84, 0)'),
    ],
    { duration: 640 },
  )
}

function choose(next: T): void {
  if (isDisabled(next) || next === model.value) return
  const from = model.value
  model.value = next
  nextTick(() => travel(from, next))
}

function onResize(): void {
  motion?.cancel()
  settle()
}

watch(model, () => nextTick(settle))
watch(signature, () => nextTick(onResize))

onMounted(async () => {
  settle()
  addEventListener('resize', onResize)
  await document.fonts?.ready
  if (disposed) return
  settle()
})

onBeforeUnmount(() => {
  disposed = true
  motion?.cancel()
  removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="ui-choice">
    <span
      v-if="label"
      :id="labelId"
      class="ui-choice-label"
      >{{ label }}</span
    >
    <div
      ref="optionsRow"
      class="ui-choice-options"
      role="radiogroup"
      :aria-disabled="disabled || undefined"
      :aria-labelledby="label ? labelId : undefined"
    >
      <button
        v-for="(option, index) in options"
        :key="option.value"
        :ref="
          el => {
            if (el) words[index] = el as HTMLElement
          }
        "
        type="button"
        role="radio"
        class="ui-choice-word"
        :class="{ 'is-active': model === option.value }"
        :aria-checked="model === option.value"
        :disabled="isDisabled(option.value)"
        :tabindex="tabindex(option.value)"
        @click="choose(option.value)"
        @keydown="onKeydown($event, choose, option.value)"
      >
        <span class="ui-choice-word-text">{{ option.label }}</span>
      </button>
      <span
        v-show="placed"
        ref="mark"
        class="ui-choice-mark"
        :style="{ left: `${rest.x}px`, top: `${rest.y}px`, width: `${rest.w}px` }"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<style scoped>
/* Choice: an accent rule under the chosen word that slides to the next one, the variant
   switch on lig.froq.me. */
.ui-choice {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 32px;
  align-items: baseline;
}

.ui-choice-label {
  color: var(--ui-muted);
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* The mark measures offsetTop + offsetHeight, so the row's line-height sets the gap. */
.ui-choice-options {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-family: var(--ui-font-meta);
  font-size: 11px;
  line-height: 1.4;
}

.ui-choice-word {
  position: relative;
  min-height: 36px;
  padding: 4px 8px;
  border: 0;
  background: none;
  color: var(--ui-muted);
  cursor: pointer;
  font: inherit;
  white-space: nowrap;
  transition: color var(--ui-dur) var(--ui-ease);
}

.ui-choice-word:hover,
.ui-choice-word.is-active {
  color: var(--ui-fg);
}

.ui-choice-word:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: -2px;
}

.ui-choice-mark {
  position: absolute;
  height: 1px;
  background: var(--ui-accent);
  pointer-events: none;
}

.ui-choice-word:disabled {
  color: var(--ui-muted);
  cursor: not-allowed;
}
</style>
