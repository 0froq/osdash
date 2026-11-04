<script setup lang="ts">
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTrigger } from 'reka-ui'
import { useSlots, useTemplateRef } from 'vue'
import { useFocusReturn, usePortalTarget } from '../../vue'
import DialogFrame from './_internal/DialogFrame.vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{
    title: string
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
    /** Internal: the custom panel owns inert content and a persistent trigger. */
    persistentPanel?: boolean
  }>(),
  {
    showTrigger: true,
    disabled: false,
    dismissible: true,
    closeOnOutside: true,
    closeOnScrollOutside: false,
    persistentPanel: false,
  },
)
const emit = defineEmits<{ openAutoFocus: [event: Event]; closeAutoFocus: [event: Event] }>()
defineSlots<{
  trigger?: () => unknown
  default?: (scope: { close: () => void }) => unknown
  footer?: (scope: { close: () => void }) => unknown
  /** Internal panel composition for Drawer. */
  panel?: (scope: { close: () => void }) => unknown
}>()
const model = defineModel<boolean>({ default: false })
const slots = useSlots()
const scope = useTemplateRef<HTMLElement>('scope')
const target = usePortalTarget(scope)
const focusReturn = useFocusReturn(
  model,
  () => props.returnFocus,
  () => !props.showTrigger,
)
function opening(event: Event) {
  focusReturn.capture(event)
  emit('openAutoFocus', event)
}
function closing(event: Event) {
  emit('closeAutoFocus', event)
  focusReturn.restore(event)
}
function close() {
  model.value = false
}
function outside(event: Event) {
  if (!props.dismissible || !props.closeOnOutside) event.preventDefault()
}
function scrollOutside() {
  if (props.dismissible && props.closeOnOutside && props.closeOnScrollOutside) close()
}
</script>

<template>
  <div
    ref="scope"
    class="ui-overlay-scope"
  >
    <DialogRoot v-model:open="model">
      <DialogTrigger
        v-if="showTrigger"
        :as-child="Boolean(slots.trigger)"
        :disabled="disabled"
        class="ui-overlay-trigger"
      >
        <slot name="trigger">{{ triggerLabel ?? title }}</slot>
      </DialogTrigger>
      <DialogPortal
        :to="portalTo ?? target"
        :disabled="!portalTo && !target"
      >
        <DialogOverlay
          class="ui ui-dialog-overlay"
          @wheel.passive="scrollOutside"
          @touchmove.passive="scrollOutside"
        />
        <DialogContent
          v-bind="{
            ...(description ? $attrs : { ...$attrs, 'aria-describedby': undefined }),
            ...(persistentPanel && !model
              ? {
                  'role': undefined,
                  'aria-labelledby': undefined,
                  'aria-describedby': undefined,
                  'tabindex': undefined,
                }
              : {}),
          }"
          as-child
          :force-mount="persistentPanel"
          @interact-outside="outside"
          @open-auto-focus="opening"
          @close-auto-focus="closing"
          @escape-key-down="!dismissible && $event.preventDefault()"
        >
          <slot
            name="panel"
            :close="close"
          >
            <DialogFrame
              :title="title"
              :description="description"
              :close-label="closeLabel"
              :dismissible="dismissible"
            >
              <slot :close="close" />
              <template
                v-if="slots.footer"
                #footer
                ><slot
                  name="footer"
                  :close="close"
              /></template>
            </DialogFrame>
          </slot>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>

<style scoped>
.ui-overlay-scope {
  display: contents;
}

.ui-overlay-trigger {
  padding: 0 0 1px;
  border: 0;
  border-bottom: 1px solid currentColor;
  background: none;
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
  font-size: inherit;
  cursor: pointer;
}

.ui-overlay-trigger:disabled {
  color: var(--ui-muted);
  cursor: not-allowed;
}

.ui-overlay-trigger:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 4px;
}

.ui-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: color-mix(in srgb, var(--ui-bg) 75%, transparent);
}

.ui-dialog-overlay[data-state='open'] {
  animation: ui-dialog-dim-in var(--ui-dur) var(--ui-ease) both;
}

.ui-dialog-overlay[data-state='closed'] {
  animation: ui-dialog-dim-out var(--ui-dur) var(--ui-ease) both;
}

@keyframes ui-dialog-dim-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes ui-dialog-dim-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-dialog-overlay[data-state] {
    animation: none;
  }
}
</style>
