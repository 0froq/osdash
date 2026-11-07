<script setup lang="ts">
/**
 * The one button. `variant` picks the surface; the interaction grammar stays
 * the same across the app: hover lifts with an accent wash, pressed/active
 * states draw in from the left, disabled goes quiet.
 *
 * - `link`    — underline text, the everyday action
 * - `outline` — pill with a hairline border, secondary actions
 * - `fill`    — solid fg pill, the one strong action (login)
 * - `chip`    — a pressable token (filters, tabs), `pressed` toggles it
 * - `row`     — a full-width row (sidebar links, menu buttons)
 * - `icon`    — a small square icon button
 */
const props = withDefaults(
  defineProps<{
    variant?: 'link' | 'outline' | 'fill' | 'chip' | 'row' | 'icon'
    type?: 'button' | 'submit' | 'reset'
    pressed?: boolean
    disabled?: boolean
  }>(),
  { variant: 'link', type: 'button' },
)
const emit = defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <button
    class="app-button"
    :class="`v-${variant}`"
    :type="type"
    :disabled="disabled"
    :aria-pressed="pressed === undefined ? undefined : pressed"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  border: 0;
  background: none;
  color: var(--fg);
  cursor: pointer;
  font: inherit;
  transition:
    color var(--dur-1) var(--ease),
    background-color var(--dur-1) var(--ease),
    background-size var(--dur-2) var(--ease),
    border-color var(--dur-1) var(--ease);
}

.app-button:disabled {
  cursor: default;
  opacity: 0.5;
}

.app-button:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 3px;
}

/* link: underline text, hover lifts an accent wash from the left. */
.v-link {
  padding: 0 2px;
  border-bottom: 1px solid color-mix(in oklab, var(--fg) 28%, transparent);
  background-image: linear-gradient(
    100deg,
    transparent 0.2em,
    color-mix(in oklab, var(--accent) 18%, transparent) 0.35em,
    color-mix(in oklab, var(--accent) 18%, transparent) calc(100% - 0.35em),
    transparent calc(100% - 0.15em)
  );
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 0 42%;
}

.v-link:hover:not(:disabled) {
  border-bottom-color: var(--fg);
  background-size: 100% 42%;
}

/* outline + fill share the pill. */
.v-outline,
.v-fill {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 13px;
}

.v-outline:hover:not(:disabled) {
  background: var(--soft);
}

.v-fill {
  border-color: transparent;
  background: var(--fg);
  color: var(--bg);
}

.v-fill:hover:not(:disabled) {
  opacity: 0.86;
}

/* chip: a token that toggles. Pressed draws the same accent wash a card title
   would, from the left, under the word. */
.v-chip {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 0;
  color: var(--muted);
  font-size: 13.5px;
  line-height: 1.5;
  background-image: linear-gradient(
    100deg,
    transparent 0.2em,
    color-mix(in oklab, var(--accent) 20%, transparent) 0.35em,
    color-mix(in oklab, var(--accent) 20%, transparent) calc(100% - 0.35em),
    transparent calc(100% - 0.15em)
  );
  background-repeat: no-repeat;
  background-position: 0 88%;
  background-size: 0 46%;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  transition:
    color 160ms var(--ease),
    background-size var(--dur-3) var(--ease);
}

.v-chip:hover:not(:disabled) {
  color: var(--fg);
}

.v-chip[aria-pressed='true'] {
  color: var(--fg);
  background-size: 100% 46%;
}

/* row: a whole row that reads as one hit target. */
.v-row {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 40px;
  padding: 6px 10px;
  border-radius: var(--radius-row);
  color: var(--muted);
  text-align: left;
}

.v-row:hover:not(:disabled) {
  background: var(--soft);
  color: var(--fg);
}

.v-row[aria-pressed='true'],
.v-row[aria-current] {
  color: var(--fg);
}

/* icon: a quiet square for a glyph or avatar. */
.v-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: var(--radius-row);
  color: var(--muted);
}

.v-icon:hover:not(:disabled) {
  background: var(--soft);
  color: var(--fg);
}
</style>
