<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    /** Draw the dashed frame. Bare icons read as clickable on their own. */
    frame?: boolean
    /** Pressed-state color. `neutral` stays monochrome; the rest tint the surface or the glyph. */
    tone?: 'neutral' | 'accent' | 'danger' | 'caution' | 'info' | 'success'
    disabled?: boolean
    /** Accessible name, required since the content is only an icon. */
    label: string
  }>(),
  {
    type: 'button',
    frame: true,
    tone: 'neutral',
    disabled: false,
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

const neutral = computed(() => props.tone === 'neutral')
defineSlots<{
  /** Icon for the off state, usually the outline or linear variant. */
  icon: () => unknown
  /** Icon for the on state, usually the filled variant. Falls back to `icon`. */
  iconOn?: () => unknown
}>()
</script>

<template>
  <button
    :type="type"
    class="ui-toggle-icon-button"
    :class="{ 'is-bare': !frame, 'is-on': pressed, 'is-tinted': pressed && !neutral }"
    :style="{ '--toggle-icon-tone': toneVar }"
    :disabled="disabled"
    :aria-pressed="pressed"
    :aria-label="label"
    @click="!disabled && (pressed = !pressed)"
  >
    <span
      class="ui-toggle-icon-button-glyph"
      aria-hidden="true"
    >
      <span class="ui-toggle-icon-button-layer is-off"><slot name="icon" /></span>
      <span
        v-if="$slots.iconOn"
        class="ui-toggle-icon-button-layer is-on"
        ><slot name="iconOn"
      /></span>
    </span>
  </button>
</template>

<style scoped>
@property --toggle-icon-tone {
  syntax: '<color>';
  inherits: true;
  initial-value: #000;
}

.ui-toggle-icon-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 36px;
  height: 36px;
  padding: 0;
  overflow: hidden;
  border: 1px dashed currentColor;
  background: none;
  color: var(--ui-muted);
  cursor: pointer;
  transition:
    color var(--ui-dur) var(--ui-ease),
    border-color var(--ui-dur) var(--ui-ease),
    background-color var(--ui-dur) var(--ui-ease);
}

.ui-toggle-icon-button.is-bare {
  border-color: transparent;
}

.ui-toggle-icon-button:hover:not(:disabled),
.ui-toggle-icon-button:focus-visible {
  border-style: solid;
  color: var(--ui-fg);
}

.ui-toggle-icon-button.is-bare:hover:not(:disabled),
.ui-toggle-icon-button.is-bare:focus-visible {
  border-color: transparent;
}

.ui-toggle-icon-button:active:not(:disabled) {
  translate: 0 1px;
}

.ui-toggle-icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* On: a faint accent surface, the frame stays. A bare button just tints the glyph. */
.ui-toggle-icon-button.is-on {
  border-style: solid;
  background: color-mix(in srgb, var(--toggle-icon-tone) 10%, transparent);
  color: var(--ui-fg);
}

.ui-toggle-icon-button.is-bare.is-on {
  border-color: transparent;
  background: none;
}

.ui-toggle-icon-button.is-bare.is-on.is-tinted {
  color: var(--toggle-icon-tone);
}

/* The two glyphs share one cell; pressed fades the off icon out and the on icon in. */
.ui-toggle-icon-button-glyph {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.ui-toggle-icon-button-layer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition:
    opacity calc(var(--ui-dur) * 0.6) var(--ui-ease),
    scale calc(var(--ui-dur) * 0.6) var(--ui-ease);
}

.ui-toggle-icon-button-layer.is-on {
  position: absolute;
  opacity: 0;
  scale: 0.85;
}

.ui-toggle-icon-button-layer :deep(svg) {
  display: block;
  width: 20px;
  height: 20px;
}

.ui-toggle-icon-button.is-on .ui-toggle-icon-button-layer.is-on {
  opacity: 1;
  scale: 1;
}

.ui-toggle-icon-button.is-on:has(.is-on) .ui-toggle-icon-button-layer.is-off {
  opacity: 0;
  scale: 0.85;
}

@media (prefers-reduced-motion: reduce) {
  .ui-toggle-icon-button,
  .ui-toggle-icon-button-layer {
    transition: none;
  }
}
</style>
