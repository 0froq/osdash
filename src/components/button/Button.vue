<script setup lang="ts">
import { useAction } from '../../vue'

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    /** Action to run on click. Resolve flashes success, reject flashes failure. */
    action?: () => unknown | Promise<unknown>
    /** Milliseconds the result flash stays before returning to idle. */
    resetAfter?: number
  }>(),
  {
    type: 'button',
    resetAfter: 900,
  },
)
const emit = defineEmits<{ click: [event: MouseEvent] }>()

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
    class="ui-button"
    :class="{
      'is-pending': status === 'pending',
      'is-success': status === 'success',
      'is-error': status === 'error',
    }"
    :aria-busy="status === 'pending' || undefined"
    @click="activate"
  >
    <slot />
  </button>
</template>

<style scoped>
.ui-button {
  position: relative;
  display: inline-flex;
  gap: 0.5em;
  align-items: center;
  padding: 2px 8px;
  overflow: hidden;
  border: 1px dashed currentColor;
  background: none;
  color: var(--ui-muted);
  cursor: pointer;
  font-family: var(--ui-font-text);
  transition: color var(--ui-dur) var(--ui-ease);
}

.ui-button:hover:not(:disabled):not(.is-success):not(.is-error):not(.is-pending),
.ui-button:focus-visible {
  border-style: solid;
  color: var(--ui-fg);
}

/* A tinted state brightens on hover instead of falling back to gray. */
.ui-button.is-success:hover:not(:disabled),
.ui-button.is-error:hover:not(:disabled),
.ui-button.is-pending:hover:not(:disabled) {
  border-style: solid;
  filter: brightness(1.15);
}

.ui-button:active:not(:disabled) {
  translate: 0 1px;
}

/* A button acting as an overlay trigger is marked twice: a small chevron says
   a layer lives behind it, and while that layer is open the frame stays solid
   and the chevron turns up (reka writes data-state on the trigger). */
.ui-button[data-state='open'] {
  border-style: solid;
  color: var(--ui-fg);
}

.ui-button[data-state]::before {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-right: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  margin-inline-start: 2px;
  content: '';
  opacity: 0.6;
  order: 1;
  transform: rotate(45deg);
  transform-origin: center;
  transition: transform var(--ui-dur) var(--ui-ease);
}

.ui-button[data-state='open']::before {
  transform: rotate(225deg);
}

.ui-button:disabled {
  color: var(--ui-muted);
  cursor: not-allowed;
}

/* Pending: the frame stays solid and the color breathes between muted and fg. */
.ui-button.is-pending {
  border-style: solid;
  cursor: wait;
  animation: ui-button-pulse 1s var(--ui-ease) infinite alternate;
}

@keyframes ui-button-pulse {
  from {
    color: var(--ui-muted);
  }

  to {
    color: var(--ui-fg);
  }
}

/* Success: a slanted fill sweeps in from the left, stays filled, then fades back. */
.ui-button.is-success {
  border-style: solid;
  border-color: var(--ui-success);
  color: var(--ui-success);
}

.ui-button.is-success::after {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--ui-success) 16%, transparent);
  clip-path: polygon(0 0, -0.8em 0, -2.4em 100%, 0 100%);
  content: '';
  opacity: 0;
  pointer-events: none;
  animation: ui-button-fill 1.2s var(--ui-ease) forwards;
}

/* The leading edge is slanted: the top runs 0.8em ahead of the bottom, and once the
   sweep ends the left side stays filled while the whole fill fades out. */
@keyframes ui-button-fill {
  0% {
    clip-path: polygon(0 0, -0.8em 0, -2.4em 100%, 0 100%);
    opacity: 1;
  }

  35% {
    clip-path: polygon(0 0, calc(100% + 1.6em) 0, 100% 100%, 0 100%);
    opacity: 1;
  }

  60% {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    opacity: 1;
  }

  100% {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    opacity: 0;
  }
}

/* Failure: the rule and the text flash danger, with a small horizontal shake. */
.ui-button.is-error {
  border-style: solid;
  border-color: var(--ui-danger);
  color: var(--ui-danger);
  animation: ui-button-shake 0.3s ease;
}

@keyframes ui-button-shake {
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
  .ui-button.is-pending,
  .ui-button.is-success::after,
  .ui-button.is-error {
    animation: none;
  }
}
</style>
