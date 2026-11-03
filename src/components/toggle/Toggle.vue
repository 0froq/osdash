<script setup lang="ts">
import WordSwap from './WordSwap.vue'

withDefaults(
  defineProps<{
    label: string
    onLabel?: string
    offLabel?: string
    disabled?: boolean
  }>(),
  {
    onLabel: 'on',
    offLabel: 'off',
    disabled: false,
  },
)
defineSlots<{
  off?: () => unknown
  on?: () => unknown
}>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <button
    type="button"
    role="switch"
    class="ui-toggle"
    :aria-checked="model"
    :aria-label="label"
    :disabled="disabled"
    @click="!disabled && (model = !model)"
  >
    <WordSwap
      :on="model"
      :off-label="offLabel"
      :on-label="onLabel"
    >
      <template #off>
        <slot name="off" />
      </template>
      <template #on>
        <slot name="on" />
      </template>
    </WordSwap>
  </button>
</template>

<style scoped>
/*Toggle: two words in one slot, the other rolls in. Inherits the font of the line it sits in.*/
.ui-toggle {
  display: inline-grid;
  padding: 0;
  border: 0;
  border-bottom: 1px dashed color-mix(in srgb, var(--ui-fg) 45%, transparent);
  background: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  letter-spacing: inherit;
  clip-path: inset(0 -0.3em);
  transition:
    border-color 0.3s var(--ui-ease),
    width 0.55s var(--ui-ease);
}

.ui-toggle:hover,
.ui-toggle:focus-visible {
  border-bottom: 1px solid var(--ui-fg);
  outline: none;
}

.ui-toggle:disabled {
  color: var(--ui-muted);
  cursor: not-allowed;
}

.ui-toggle:disabled {
  border-bottom: 1px dashed var(--ui-line);
}
</style>
