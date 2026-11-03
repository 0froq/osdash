<script setup lang="ts">
import { computed } from 'vue'
import WordSwap from '../toggle/WordSwap.vue'

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    /** Accessible name. Omit when the default slot carries text. */
    label?: string
    /** Label while not pressed. Diffed against `onText` into shared head, swapped middle, shared tail. */
    offText?: string
    /** Label while pressed. */
    onText?: string
    /** Swap the whole labels at once instead of isolating the differing middle. */
    whole?: boolean
    /** Pressed-state surface color. `neutral` stays monochrome. */
    tone?: 'neutral' | 'accent' | 'danger' | 'caution' | 'info' | 'success'
  }>(),
  {
    type: 'button',
    disabled: false,
    offText: '',
    onText: '',
    whole: false,
    tone: 'neutral',
  },
)
const pressed = defineModel<boolean>({ default: false })

const toneVar = computed(() => {
  const map: Record<string, string> = {
    neutral: 'var(--ui-fg)',
    accent: 'var(--ui-accent)',
    danger: 'var(--ui-danger)',
    caution: 'var(--ui-caution)',
    info: 'var(--ui-info)',
    success: 'var(--ui-success)',
  }
  return map[props.tone] ?? map.neutral
})
defineSlots<{
  /**
   * Custom label sequence. Nest `WordSwap` cells anywhere to roll their own
   * off/on pairs independently.
   */
  default?: () => unknown
}>()

/** Longest common prefix of two strings. */
function commonPrefix(a: string, b: string): number {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

/** Longest common suffix, not overlapping the shared prefix. */
function commonSuffix(a: string, b: string, used: number): number {
  let i = 0
  while (i < a.length - used && i < b.length - used && a[a.length - 1 - i] === b[b.length - 1 - i])
    i++
  return i
}

/* Auto three-part split unless `whole` forces the entire labels to swap. */
const diff = computed(() => {
  const off = props.offText
  const on = props.onText
  if (props.whole) return { head: '', tail: '', off, on }
  const head = commonPrefix(off, on)
  const tail = commonSuffix(off, on, head)
  return {
    head: off.slice(0, head),
    tail: tail ? off.slice(off.length - tail) : '',
    off: off.slice(head, off.length - tail),
    on: on.slice(head, on.length - tail),
  }
})
const auto = computed(() => props.offText !== '' || props.onText !== '')

function toggle(): void {
  if (props.disabled) return
  pressed.value = !pressed.value
}
</script>

<template>
  <button
    :type="type"
    class="ui-toggle-button"
    :class="{ 'is-on': pressed }"
    :style="{ '--toggle-button-tone': toneVar }"
    :disabled="disabled"
    :aria-pressed="pressed"
    :aria-label="label || (auto ? `${offText} / ${onText}` : undefined)"
    @click="toggle"
  >
    <span
      v-if="auto"
      class="ui-toggle-button-label"
      >{{ diff.head
      }}<WordSwap
        :on="pressed"
        :off-label="diff.off"
        :on-label="diff.on"
      />{{ diff.tail }}</span
    >
    <span
      v-else
      class="ui-toggle-button-label"
      ><slot
    /></span>
  </button>
</template>

<style scoped>
@property --toggle-button-tone {
  syntax: '<color>';
  inherits: true;
  initial-value: #000;
}

.ui-toggle-button {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  overflow: hidden;
  border: 1px dashed currentColor;
  background: none;
  color: var(--ui-muted);
  cursor: pointer;
  font-family: var(--ui-font-text);
  transition:
    color var(--ui-dur) var(--ui-ease),
    border-color var(--ui-dur) var(--ui-ease),
    background-color var(--ui-dur) var(--ui-ease);
}

.ui-toggle-button:hover:not(:disabled),
.ui-toggle-button:focus-visible {
  border-style: solid;
  color: var(--ui-fg);
}

.ui-toggle-button:active:not(:disabled) {
  translate: 0 1px;
}

/* The label lives in a normal inline flow so spaces around a swapped word survive. */
.ui-toggle-button-label {
  display: inline;
}

.ui-toggle-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* On: a faint surface in the tone, the frame stays. */
.ui-toggle-button.is-on {
  border-style: solid;
  background: color-mix(in srgb, var(--toggle-button-tone) 10%, transparent);
  color: var(--ui-fg);
}

@media (prefers-reduced-motion: reduce) {
  .ui-toggle-button {
    transition: none;
  }
}
</style>
