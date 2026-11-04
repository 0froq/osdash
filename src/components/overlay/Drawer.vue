<script setup lang="ts">
import { DialogTrigger } from 'reka-ui'
import { computed, ref, useSlots, watch } from 'vue'
import { prefersReducedMotion } from '../../core'
import Dialog from './Dialog.vue'
import DialogFrame from './_internal/DialogFrame.vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{
    title?: string
    closeLabel: string
    description?: string
    triggerLabel?: string
    showTrigger?: boolean
    returnFocus?: HTMLElement
    disabled?: boolean
    dismissible?: boolean
    closeOnOutside?: boolean
    closeOnScrollOutside?: boolean
    portalTo?: string | HTMLElement
    side?: 'left' | 'right' | 'bottom'
    handleOffset?: string
  }>(),
  {
    side: 'right',
    handleOffset: '24px',
    showTrigger: true,
    disabled: false,
    dismissible: true,
    closeOnOutside: true,
    closeOnScrollOutside: false,
  },
)
defineSlots<{
  trigger?: () => unknown
  /** Visual content of the built-in persistent toggle button. */
  handle?: (scope: { open: boolean }) => unknown
  default?: (scope: { close: () => void }) => unknown
  footer?: (scope: { close: () => void }) => unknown
}>()
const model = defineModel<boolean>({ default: false })
const slots = useSlots()
function hasHandle() {
  return Boolean(slots.handle) && props.showTrigger
}
const bodyPresent = ref(model.value)
watch(model, open => {
  if (open || !hasHandle() || prefersReducedMotion()) bodyPresent.value = open
})
function finishClose() {
  if (!model.value) bodyPresent.value = false
}
function handleKeydown(event: KeyboardEvent) {
  // The modal's focus loop must not retain Tab on the closed drawer's only control.
  if (!model.value && event.key === 'Tab') event.stopPropagation()
}
const handlePosition = computed(() =>
  props.side === 'bottom' ? { left: props.handleOffset } : { top: props.handleOffset },
)
const dialogProps = computed(() => {
  const { side: _, handleOffset: _offset, ...rest } = props
  return { ...rest, title: props.title ?? '' }
})
const renderClose = computed(() => props.dismissible && !hasHandle())
</script>

<template>
  <Dialog
    v-bind="{ ...$attrs, ...dialogProps }"
    v-model="model"
    :persistent-panel="hasHandle()"
    :show-trigger="hasHandle() ? false : showTrigger"
  >
    <template
      v-if="slots.trigger"
      #trigger
    >
      <slot name="trigger" />
    </template>
    <template #panel="{ close }">
      <div
        v-if="hasHandle()"
        class="ui ui-drawer-shell"
        :data-side="side"
        @after-leave="finishClose"
      >
        <DialogFrame
          class="ui-drawer-content is-handled"
          :data-side="side"
          :title="title"
          :description="description"
          :close-label="closeLabel"
          :render-close="renderClose"
          :inert="!model || undefined"
          :aria-hidden="!model || undefined"
        >
          <template v-if="bodyPresent">
            <slot :close="close" />
          </template>
          <template
            v-if="bodyPresent && slots.footer"
            #footer
          >
            <slot
              name="footer"
              :close="close"
            />
          </template>
        </DialogFrame>
        <DialogTrigger
          as-child
          :disabled="model ? !dismissible : disabled"
        >
          <button
            type="button"
            class="ui-drawer-handle"
            :style="handlePosition"
            :aria-label="model ? closeLabel : (triggerLabel ?? title)"
            @keydown="handleKeydown"
          >
            <slot
              name="handle"
              :open="model"
            />
          </button>
        </DialogTrigger>
      </div>
      <DialogFrame
        v-else
        class="ui-drawer-content"
        :data-side="side"
        :title="title"
        :description="description"
        :close-label="closeLabel"
        :dismissible="dismissible"
      >
        <slot :close="close" />
        <template
          v-if="slots.footer"
          #footer
        >
          <slot
            name="footer"
            :close="close"
          />
        </template>
      </DialogFrame>
    </template>
  </Dialog>
</template>

<style scoped>
.ui-dialog-content.ui-drawer-content {
  top: 0;
  right: 0;
  bottom: 0;
  left: auto;
  width: min(26rem, calc(100vw - 24px));
  height: 100dvh;
  max-height: none;
  border-top: 0;
  border-right: 0;
  border-bottom: 0;
  border-radius: 0;
  transform: none;
  overscroll-behavior: contain;
}

.ui-dialog-content.ui-drawer-content[data-side='left'] {
  right: auto;
  left: 0;
  border-right: 1px solid var(--ui-line);
  border-left: 0;
}

.ui-dialog-content.ui-drawer-content[data-side='bottom'] {
  top: auto;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: auto;
  max-height: calc(100dvh - 24px);
  border-top: 1px solid var(--ui-line);
  border-left: 0;
}

.ui-drawer-content[data-state='open'] {
  animation: ui-drawer-right-in var(--ui-dur) var(--ui-ease) both;
}

.ui-drawer-content[data-state='closed'] {
  animation: ui-drawer-right-out var(--ui-dur) var(--ui-ease) both;
}

.ui-drawer-content[data-side='left'][data-state='open'] {
  animation-name: ui-drawer-left-in;
}

.ui-drawer-content[data-side='left'][data-state='closed'] {
  animation-name: ui-drawer-left-out;
}

.ui-drawer-content[data-side='bottom'][data-state='open'] {
  animation-name: ui-drawer-bottom-in;
}

.ui-drawer-content[data-side='bottom'][data-state='closed'] {
  animation-name: ui-drawer-bottom-out;
}

@keyframes ui-drawer-right-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes ui-drawer-right-out {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100%);
  }
}

@keyframes ui-drawer-left-in {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes ui-drawer-left-out {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}

@keyframes ui-drawer-bottom-in {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes ui-drawer-bottom-out {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}

.ui-drawer-shell {
  position: fixed;
  z-index: 1001;
  top: 0;
  right: 0;
  width: min(26rem, calc(100vw - 48px));
  height: 100dvh;
  transition: transform var(--ui-dur) var(--ui-ease);
}

.ui-drawer-shell[data-side='left'] {
  right: auto;
  left: 0;
}

.ui-drawer-shell[data-side='bottom'] {
  top: auto;
  bottom: 0;
  left: 0;
  width: 100%;
  height: auto;
}

.ui-drawer-shell[data-state='closed'] {
  transform: translateX(100%);
  /* Keep the modal layer present until the shell's movement finishes. */
  animation: ui-drawer-hold var(--ui-dur);
}

.ui-drawer-shell[data-side='left'][data-state='closed'] {
  transform: translateX(-100%);
}

.ui-drawer-shell[data-side='bottom'][data-state='closed'] {
  transform: translateY(100%);
}

.ui-dialog-content.ui-drawer-content.is-handled {
  position: relative;
  inset: auto;
  width: 100%;
  height: 100%;
  max-height: 100dvh;
}

.ui-drawer-shell[data-side='bottom'] .ui-drawer-content.is-handled {
  height: auto;
}

.ui-drawer-handle {
  position: absolute;
  right: 100%;
  display: grid;
  place-items: center;
  min-width: 36px;
  min-height: 36px;
  padding: 2px;
  /*border: 1px solid var(--ui-line);*/
  border: none;
  background: var(--ui-bg);
  color: var(--ui-fg);
  font: inherit;
  cursor: pointer;
}

/* The panel supplies the shared edge, so the handle must not draw a second line. */
.ui-drawer-shell[data-side='right'] .ui-drawer-handle {
  border-right: 0;
}

.ui-drawer-shell[data-side='left'] .ui-drawer-handle {
  right: auto;
  left: 100%;
  border-left: 0;
}

.ui-drawer-shell[data-side='bottom'] .ui-drawer-handle {
  right: auto;
  bottom: 100%;
  border-bottom: 0;
}

.ui-drawer-handle:disabled {
  color: var(--ui-muted);
  cursor: not-allowed;
}

.ui-drawer-handle:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: -4px;
}

@keyframes ui-drawer-hold {
  from {
    opacity: 1;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-dialog-content.ui-drawer-content[data-state],
  .ui-drawer-shell[data-state] {
    animation: none;
    transition: none;
  }
}
</style>
