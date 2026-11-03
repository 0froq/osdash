<script setup lang="ts" generic="T extends string">
import type { ChoiceOption } from '../../vue'
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { looseEllipse, toPath } from '../../core'
import { useChoice } from '../../vue'

const props = defineProps<{
  options: ChoiceOption<T>[]
  label?: string
  disabled?: boolean
}>()
const model = defineModel<T>({ required: true })

const { values, signature, isDisabled, tabindex, onKeydown } = useChoice(
  () => props.options,
  model,
  () => props.disabled ?? false,
)

const words: HTMLElement[] = []
const box = reactive({ x: 0, y: 0, w: 0, h: 0 })
const drawn = ref(0)
const placed = ref(false)
let disposed = false

const ring = toPath(looseEllipse(50, 20, 47, 17))

function place(): void {
  const word = words[values.value.indexOf(model.value)]
  if (!word) {
    placed.value = false
    return
  }
  box.x = word.offsetLeft - 14
  box.y = word.offsetTop - 9
  box.w = word.offsetWidth + 28
  box.h = word.offsetHeight + 18
  placed.value = true
}

function choose(next: T): void {
  if (isDisabled(next) || next === model.value) return
  model.value = next
  drawn.value++
}

watch(model, () => nextTick(place))
watch(signature, () => nextTick(place))

onMounted(async () => {
  place()
  addEventListener('resize', place)
  await document.fonts?.ready
  if (disposed) return
  place()
})

onBeforeUnmount(() => {
  disposed = true
  removeEventListener('resize', place)
})
</script>

<template>
  <div
    class="ui-circle"
    role="radiogroup"
    :aria-disabled="disabled || undefined"
    :aria-label="label"
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
      class="ui-circle-word"
      :class="{ 'is-active': model === option.value }"
      :aria-checked="model === option.value"
      :disabled="isDisabled(option.value)"
      :tabindex="tabindex(option.value)"
      @click="choose(option.value)"
      @keydown="onKeydown($event, choose, option.value)"
    >
      {{ option.label }}
    </button>
    <svg
      v-show="placed"
      :key="drawn"
      class="ui-circle-ring"
      :class="{ 'is-drawn': drawn > 0 }"
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      :style="{ left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` }"
      aria-hidden="true"
    >
      <path
        :d="ring"
        pathLength="1"
      />
    </svg>
  </div>
</template>

<style scoped>
/*ChoiceCircle: the pen circles the chosen word.*/
.ui-circle {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 14px 36px;
  padding: 0 6px;
}

.ui-circle-word {
  padding: 0;
  border: 0;
  background: none;
  color: var(--ui-muted);
  cursor: pointer;
  font-family: var(--ui-font-meta);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: color 0.3s var(--ui-ease);
}

.ui-circle-word:hover,
.ui-circle-word:focus-visible,
.ui-circle-word.is-active {
  color: var(--ui-fg);
  outline: none;
}

.ui-circle-ring {
  position: absolute;
  overflow: visible;
  pointer-events: none;
}

.ui-circle-word:disabled {
  color: var(--ui-muted);
  cursor: not-allowed;
}

.ui-circle-ring :deep(path) {
  fill: none;
  stroke: var(--ui-fg);
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
}

.ui-circle-ring.is-drawn :deep(path) {
  animation: ui-draw 0.8s var(--ui-ease) both;
}

@media (prefers-reduced-motion: reduce) {
  .ui-circle-ring.is-drawn :deep(path) {
    animation: none;
  }
}

@keyframes ui-draw {
  from {
    stroke-dashoffset: 1;
  }
}
</style>
