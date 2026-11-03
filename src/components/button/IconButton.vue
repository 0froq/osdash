<script setup lang="ts">
import { useAction } from '../../vue'

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    /** Action to run on click. Resolve shows success, reject shows error. */
    action?: () => unknown | Promise<unknown>
    /** Milliseconds the result state stays before returning to idle. */
    resetAfter?: number
    /** Draw the dashed frame. Bare icons read as clickable on their own. */
    frame?: boolean
    /** Accessible name, required since the content is only an icon. */
    label: string
  }>(),
  {
    type: 'button',
    resetAfter: 900,
    frame: true,
  },
)
const emit = defineEmits<{ click: [event: MouseEvent] }>()
defineSlots<{
  /** Resting icon, usually the outline or linear variant. */
  icon: () => unknown
  /** Shown while hovered. Falls back to `icon`. */
  iconHover?: () => unknown
  /** Shown after the action succeeds. Falls back to `icon`. */
  iconActive?: () => unknown
  /** Shown after the action fails. Falls back to `icon`. */
  iconError?: () => unknown
}>()

const { status, run } = useAction(
  () => props.action,
  () => props.resetAfter,
)

function activate(event: MouseEvent): void {
  emit('click', event)
  run()
}
</script>

<template>
  <button
    :type="type"
    class="ui-icon-button"
    :class="{
      'is-bare': !frame,
      'is-pending': status === 'pending',
      'is-success': status === 'success',
      'is-error': status === 'error',
    }"
    :aria-label="label"
    :aria-busy="status === 'pending' || undefined"
    @click="activate"
  >
    <span
      class="ui-icon-button-glyph"
      aria-hidden="true"
    >
      <span class="ui-icon-button-layer is-idle"><slot name="icon" /></span>
      <span
        v-if="$slots.iconHover"
        class="ui-icon-button-layer is-hover"
        ><slot name="iconHover"
      /></span>
      <span
        v-if="$slots.iconActive"
        class="ui-icon-button-layer is-active"
        ><slot name="iconActive"
      /></span>
      <span
        v-if="$slots.iconError"
        class="ui-icon-button-layer is-error"
        ><slot name="iconError"
      /></span>
    </span>
  </button>
</template>

<style scoped>
.ui-icon-button {
  position: relative;
  display: inline-grid;
  box-sizing: border-box;
  width: 36px;
  height: 36px;
  place-items: center;
  padding: 0;
  overflow: hidden;
  border: 1px dashed currentColor;
  background: none;
  color: var(--ui-muted);
  cursor: pointer;
  transition: color var(--ui-dur) var(--ui-ease);
}

/* Bare: no frame, the icon itself carries the affordance. */
.ui-icon-button.is-bare {
  border-color: transparent;
}

.ui-icon-button:hover:not(:disabled):not(.is-success):not(.is-error):not(.is-pending),
.ui-icon-button:focus-visible {
  border-style: solid;
  color: var(--ui-fg);
}

.ui-icon-button.is-bare:hover:not(:disabled):not(.is-success):not(.is-error):not(.is-pending),
.ui-icon-button.is-bare:focus-visible {
  border-color: transparent;
}

/* A bare button never shows a frame, in any state. */
.ui-icon-button.is-bare.is-pending,
.ui-icon-button.is-bare.is-success,
.ui-icon-button.is-bare.is-error {
  border-color: transparent;
}

.ui-icon-button:active:not(:disabled) {
  translate: 0 1px;
}

.ui-icon-button:disabled {
  color: var(--ui-muted);
  cursor: not-allowed;
}

/* Icon layers stack; the active one is visible. */
.ui-icon-button-glyph {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.ui-icon-button-layer {
  display: inline-flex;
  grid-area: 1 / 1;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition:
    opacity calc(var(--ui-dur) * 0.6) var(--ui-ease),
    scale calc(var(--ui-dur) * 0.6) var(--ui-ease);
}

.ui-icon-button-layer:not(.is-idle) {
  position: absolute;
  opacity: 0;
  scale: 0.85;
}

.ui-icon-button-layer > :deep(svg) {
  width: 20px;
  height: 20px;
}

/* Hover swaps to the hover icon when provided; pending holds it so the icon does not
   flicker back to the outline while the action runs. */
.ui-icon-button:hover:not(:disabled) .ui-icon-button-layer.is-hover,
.ui-icon-button.is-pending .ui-icon-button-layer.is-hover {
  opacity: 1;
  scale: 1;
}

.ui-icon-button:hover:not(:disabled):has(.is-hover) .ui-icon-button-layer.is-idle,
.ui-icon-button.is-pending:has(.is-hover) .ui-icon-button-layer.is-idle {
  opacity: 0;
  scale: 0.85;
}

/* Success swaps to the active icon. Pending keeps the resting icon and pulses. */
.ui-icon-button.is-success .ui-icon-button-layer.is-active {
  opacity: 1;
  scale: 1;
}

.ui-icon-button.is-success:has(.is-active) .ui-icon-button-layer.is-idle,
.ui-icon-button.is-success:has(.is-active) .ui-icon-button-layer.is-hover {
  opacity: 0;
  scale: 0.85;
}

/* Error swaps to the error icon. */
.ui-icon-button.is-error .ui-icon-button-layer.is-error {
  opacity: 1;
  scale: 1;
}

.ui-icon-button.is-error:has(.is-error) .ui-icon-button-layer.is-idle,
.ui-icon-button.is-error:has(.is-error) .ui-icon-button-layer.is-hover,
.ui-icon-button.is-error:has(.is-error) .ui-icon-button-layer.is-active {
  opacity: 0;
  scale: 0.85;
}

/* Pending: the frame stays solid and the color breathes. */
.ui-icon-button.is-pending {
  border-style: solid;
  cursor: wait;
  animation: ui-icon-button-pulse 1s var(--ui-ease) infinite alternate;
}

@keyframes ui-icon-button-pulse {
  from {
    color: var(--ui-muted);
  }

  to {
    color: var(--ui-fg);
  }
}

.ui-icon-button.is-success {
  border-style: solid;
  border-color: var(--ui-success);
  color: var(--ui-success);
}

.ui-icon-button.is-error {
  border-style: solid;
  border-color: var(--ui-danger);
  color: var(--ui-danger);
  animation: ui-icon-button-shake 0.3s ease;
}

@keyframes ui-icon-button-shake {
  0%,
  100% {
    translate: 0 0;
  }

  25% {
    translate: -2px 0;
  }

  75% {
    translate: 2px 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-icon-button.is-pending,
  .ui-icon-button.is-error,
  .ui-icon-button-layer {
    transition: none;
    animation: none;
  }
}
</style>
