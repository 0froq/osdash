<script setup lang="ts">
import type { CodeSpan } from '../../vue'
import { computed, useId, useTemplateRef, watch } from 'vue'
import { useClipboard, useDisclosure } from '../../vue'

const props = withDefaults(
  defineProps<{
    /** Visible title, usually a filename. A blank label draws no title row. */
    label?: string
    code?: string
    spans?: readonly CodeSpan[]
    /** Fold the source behind the title. A frame without a title cannot fold. */
    collapsible?: boolean
    /** Idle copy label. Set it to render the built-in copy action. */
    copyLabel?: string
    copiedLabel?: string
    copyErrorLabel?: string
    pendingLabel?: string
    resetAfter?: number
  }>(),
  {
    label: '',
    collapsible: false,
    copyLabel: '',
    copiedLabel: 'Copied',
    copyErrorLabel: 'Copy failed',
    resetAfter: 1600,
  },
)
const emit = defineEmits<{
  copy: [text: string]
  copyError: [error: Error]
}>()
defineSlots<{
  action?: () => unknown
  default?: () => unknown
}>()
const open = defineModel<boolean>('open', { default: false })
const titled = computed(() => props.label.trim().length > 0)
const foldable = computed(() => props.collapsible && titled.value)
const canCopy = computed(() => props.copyLabel.trim().length > 0)
const id = useId()
const triggerId = `${id}-trigger`
const panelId = `${id}-panel`
const panel = useTemplateRef<HTMLElement>('panel')
const { toggle } = useDisclosure(open)

const { status, copy } = useClipboard(
  () => props.code ?? '',
  () => props.resetAfter,
)
const labels = computed(() => ({
  idle: props.copyLabel,
  pending: props.pendingLabel ?? props.copyLabel,
  copied: props.copiedLabel,
  error: props.copyErrorLabel,
}))

async function activate(): Promise<void> {
  const result = await copy()
  if (result?.ok) emit('copy', result.text)
  else if (result) emit('copyError', result.error)
}

watch(open, value => {
  if (!foldable.value || value || typeof document === 'undefined') return
  if (panel.value?.contains(document.activeElement)) document.getElementById(triggerId)?.focus()
})
</script>

<template>
  <div
    class="ui-code-block"
    :class="{ 'is-titled': titled, 'is-collapsible': foldable, 'is-open': foldable && open }"
  >
    <header
      v-if="titled"
      class="ui-code-block-header"
    >
      <button
        v-if="foldable"
        :id="triggerId"
        type="button"
        class="ui-code-block-toggle"
        :aria-expanded="open"
        :aria-controls="panelId"
        @click="toggle"
      >
        <span
          class="ui-code-block-chevron"
          aria-hidden="true"
        />
        <span>{{ label }}</span>
      </button>
      <span v-else>{{ label }}</span>
      <div
        v-if="canCopy || $slots.action"
        class="ui-code-block-action"
      >
        <button
          v-if="canCopy"
          type="button"
          class="ui-code-block-copy"
          :disabled="status === 'pending'"
          :aria-busy="status === 'pending'"
          :aria-label="labels[status]"
          @click="activate"
        >
          <span
            class="ui-code-block-copy-labels"
            aria-hidden="true"
          >
            <span
              v-for="(textLabel, state) in labels"
              :key="state"
              class="ui-code-block-copy-label"
              :class="{ 'is-visible': state === status }"
              >{{ textLabel }}</span
            >
          </span>
          <span
            class="ui-code-block-copy-status"
            role="status"
            aria-atomic="true"
            >{{ status === 'copied' || status === 'error' ? labels[status] : '' }}</span
          >
        </button>
        <slot name="action" />
      </div>
    </header>
    <div
      v-else-if="canCopy || $slots.action"
      class="ui-code-block-action is-corner"
    >
      <button
        v-if="canCopy"
        type="button"
        class="ui-code-block-copy"
        :disabled="status === 'pending'"
        :aria-busy="status === 'pending'"
        :aria-label="labels[status]"
        @click="activate"
      >
        <span
          class="ui-code-block-copy-labels"
          aria-hidden="true"
        >
          <span
            v-for="(textLabel, state) in labels"
            :key="state"
            class="ui-code-block-copy-label"
            :class="{ 'is-visible': state === status }"
            >{{ textLabel }}</span
          >
        </span>
        <span
          class="ui-code-block-copy-status"
          role="status"
          aria-atomic="true"
          >{{ status === 'copied' || status === 'error' ? labels[status] : '' }}</span
        >
      </button>
      <slot name="action" />
    </div>
    <div
      :id="foldable ? panelId : undefined"
      ref="panel"
      class="ui-code-block-panel"
      :hidden="foldable && !open ? true : undefined"
      :inert="foldable && !open ? true : undefined"
      :aria-hidden="foldable && !open ? true : undefined"
    >
      <div class="ui-code-block-clip">
        <div class="ui-code-block-body">
          <slot>
            <pre class="ui-code-block-pre"><code><template v-if="spans"><span
              v-for="(span, index) in spans"
              :key="index"
              :style="span.color ? { color: span.color } : undefined"
            >{{ span.text }}</span></template><template v-else>{{ code }}</template></code></pre>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-code-block {
  position: relative;
  min-width: 0;
  padding: 16px 18px;
  color: var(--ui-fg);
  border: 1px solid var(--ui-line);
}

.ui-code-block-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  color: var(--ui-muted);
  font-family: var(--ui-font-meta);
  font-size: 12px;
  line-height: 1.5;
}

/*A titled frame sets its title off from the source with a rule.*/
.ui-code-block.is-titled > .ui-code-block-header {
  padding-bottom: 10px;
  border-bottom: 1px solid var(--ui-line);
}

.ui-code-block-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition: color var(--ui-dur) var(--ui-ease);
}

.ui-code-block-toggle:hover,
.ui-code-block.is-open .ui-code-block-toggle {
  color: var(--ui-fg);
}

.ui-code-block-toggle:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 3px;
}

.ui-code-block-chevron {
  flex: none;
  width: 6px;
  height: 6px;
  border-inline-end: 1px solid currentColor;
  border-block-end: 1px solid currentColor;
  transform: rotate(-45deg);
  transition: transform 0.32s var(--ui-ease);
}

.ui-code-block-toggle[aria-expanded='true'] .ui-code-block-chevron {
  transform: rotate(45deg);
}

/*Closed is one title row. The title's offset from the top never changes, so it stays put;
   only the space below grows to the frame's usual padding as the source comes in.
   The title carries its own top space so that, pinned, it does not touch the screen edge.
   The rule stays in both states, so a closed folder reads like a titled block that never folds.*/
.ui-code-block.is-collapsible {
  padding-block: 8px 20px;
  transition: padding-block-end 320ms var(--ui-ease);
}

.ui-code-block.is-collapsible > .ui-code-block-header {
  position: relative;
  padding-top: 12px;
  background-color: transparent;
  box-shadow: 0 0 20px 10px transparent;
  transition:
    background-color 320ms var(--ui-ease),
    box-shadow 320ms var(--ui-ease);
}

.ui-code-block.is-collapsible.is-open {
  padding-block-end: 24px;
}

/*Open, the title pins to the top while its block is on screen, and the source fades out beneath it.
   Unpinned, the fade rests on the gap between title and source. A host with a fixed bar overrides `top`.*/
.ui-code-block.is-collapsible.is-open > .ui-code-block-header {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: var(--ui-bg);
  box-shadow: 0 0 20px 10px var(--ui-bg);
}

/*The fade is always laid out and only its opacity changes, so closing it does not snap.*/
.ui-code-block.is-collapsible > .ui-code-block-header::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  top: 100%;
  height: 14px;
  background: linear-gradient(var(--ui-bg), transparent);
  opacity: 0;
  pointer-events: none;
  transition: opacity 320ms var(--ui-ease);
}

.ui-code-block.is-collapsible.is-open > .ui-code-block-header::after {
  opacity: 1;
}

.ui-code-block.is-collapsible .ui-code-block-panel,
.ui-code-block.is-collapsible .ui-code-block-panel[hidden] {
  display: grid !important;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 320ms var(--ui-ease),
    opacity 180ms var(--ui-ease);
}

.ui-code-block.is-collapsible.is-open .ui-code-block-panel {
  grid-template-rows: 1fr;
  opacity: 1;
}

.ui-code-block.is-collapsible .ui-code-block-clip {
  overflow: hidden;
}

.ui-code-block.is-titled .ui-code-block-pre {
  margin-top: 14px;
}

.ui-code-block-action {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-inline-start: auto;
}

/*Without a title, the action floats over the top corner of the source.*/
.ui-code-block-action.is-corner {
  position: absolute;
  top: 8px;
  inset-inline-end: 8px;
  margin-inline-start: 0;
}

.ui-code-block-action :deep(:where(a)) {
  color: inherit;
  text-decoration: none;
  transition: color var(--ui-dur) var(--ui-ease);
}

.ui-code-block-action :deep(:where(a):hover) {
  color: var(--ui-fg);
}

/*The built-in copy action keeps the title's meta type; a boxed pill over an untitled corner.*/
.ui-code-block-copy {
  position: relative;
  padding: 2px 8px;
  border: 1px solid var(--ui-line);
  background: none;
  color: var(--ui-muted);
  font-family: var(--ui-font-text);
  font-size: 12px;
  line-height: 1.7;
  cursor: pointer;
  transition: color var(--ui-dur) var(--ui-ease);
}

.ui-code-block-copy:hover:not(:disabled) {
  color: var(--ui-fg);
}

.ui-code-block-copy:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 3px;
}

.ui-code-block-copy:disabled {
  cursor: default;
}

.ui-code-block-copy-labels {
  display: inline-grid;
  vertical-align: baseline;
}

.ui-code-block-copy-label {
  grid-area: 1 / 1;
  visibility: hidden;
  white-space: nowrap;
}

.ui-code-block-copy-label.is-visible {
  visibility: visible;
}

.ui-code-block-copy-status {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.ui-code-block-clip,
.ui-code-block-body {
  min-width: 0;
  min-height: 0;
}

.ui-code-block-pre {
  margin: 0;
  overflow-x: auto;
  color: inherit;
  font-family: var(--ui-font-meta);
  font-size: 13.5px;
  line-height: 1.6;
  white-space: pre;
  tab-size: 2;
}

@media (prefers-reduced-motion: reduce) {
  .ui-code-block-action :deep(:where(a)),
  .ui-code-block-copy,
  .ui-code-block-toggle,
  .ui-code-block-chevron,
  .ui-code-block.is-collapsible,
  .ui-code-block.is-collapsible > .ui-code-block-header,
  .ui-code-block.is-collapsible > .ui-code-block-header::after,
  .ui-code-block.is-collapsible .ui-code-block-panel,
  .ui-code-block.is-collapsible .ui-code-block-panel[hidden] {
    transition: none;
  }
}

@media (max-width: 600px) {
  .ui-code-block.is-collapsible {
    padding-block: 4px 16px;
  }

  .ui-code-block.is-collapsible.is-open {
    padding-block-end: 16px;
  }
}
</style>
