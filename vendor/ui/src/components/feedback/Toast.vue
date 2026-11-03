<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import {
  injectToastProviderContext,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastRoot,
  ToastTitle,
} from 'reka-ui'
import { computed, useSlots, useTemplateRef } from 'vue'
import { useAutoDismiss } from '../../vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{
    title: string
    closeLabel: string
    description?: string
    duration?: number
    type?: 'foreground' | 'background'
    action?: { label: string; altText: string }
  }>(),
  { type: 'foreground' },
)
const emit = defineEmits<{ action: [event: MouseEvent] }>()
defineSlots<{ default?: () => unknown }>()
const open = defineModel<boolean>({ default: false })
const provider = injectToastProviderContext()
const root = useTemplateRef<ComponentPublicInstance>('root')
const slots = useSlots()
let globalEscape = false

function close() {
  const element = root.value?.$el
  if (
    typeof HTMLElement !== 'undefined' &&
    element instanceof HTMLElement &&
    element.contains(document.activeElement)
  )
    provider.viewport.value?.focus()
  open.value = false
}

useAutoDismiss(open, {
  duration: computed(() => props.duration ?? provider.duration.value),
  paused: provider.isClosePausedRef,
  onDismiss: close,
})
function update(next: boolean) {
  if (!next && globalEscape) return
  if (next) open.value = true
  else close()
}
// Reka 2.10.5 listens on the document; an unrelated Escape must not dismiss this toast.
function ignoreGlobalEscape() {
  globalEscape = true
  queueMicrotask(() => {
    globalEscape = false
  })
}
function escape(event: KeyboardEvent) {
  if (event.defaultPrevented) return
  event.preventDefault()
  event.stopPropagation()
  close()
}
</script>

<template>
  <ToastRoot
    ref="root"
    v-bind="$attrs"
    class="ui-toast"
    :open="open"
    :type="type"
    :duration="0"
    @update:open="update"
    @escape-key-down="ignoreGlobalEscape"
    @keydown.esc="escape"
  >
    <div class="ui-toast-body">
      <ToastTitle class="ui-toast-title">
        {{ title }}
      </ToastTitle>
      <ToastDescription
        v-if="description || slots.default"
        class="ui-toast-description"
      >
        <slot>
          {{ description }}
        </slot>
      </ToastDescription>
      <ToastAction
        v-if="action"
        class="ui-toast-action"
        :alt-text="action.altText"
        @click="emit('action', $event)"
      >
        {{ action.label }}
      </ToastAction>
    </div>
    <ToastClose
      class="ui-toast-close"
      :aria-label="closeLabel"
    >
      <span aria-hidden="true">×</span>
    </ToastClose>
  </ToastRoot>
</template>

<style scoped>
.ui-toast {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid var(--ui-line);
  border-inline-start: 3px solid var(--ui-accent);
  border-radius: var(--ui-radius);
  background: var(--ui-bg);
  box-shadow: none;
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
}

.ui-toast-body {
  display: grid;
  flex: 1;
  gap: 8px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ui-toast-description {
  color: var(--ui-muted);
}

.ui-toast-close,
.ui-toast-action {
  padding: 4px 8px;
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  background: transparent;
  color: var(--ui-fg);
  font: inherit;
  cursor: pointer;
}

.ui-toast-action {
  justify-self: start;
  color: var(--ui-accent);
}

.ui-toast-close {
  flex: 0 0 auto;
}

.ui-toast:focus-visible,
.ui-toast-close:focus-visible,
.ui-toast-action:focus-visible {
  outline: 2px solid var(--ui-accent);
  outline-offset: 2px;
}
</style>
