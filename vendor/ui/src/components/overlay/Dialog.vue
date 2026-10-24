<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
import { useSlots, useTemplateRef } from 'vue'
import { useFocusReturn, usePortalTarget } from '../../vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  title: string
  closeLabel: string
  description?: string
  triggerLabel?: string
  showTrigger?: boolean
  returnFocus?: HTMLElement
  disabled?: boolean
  dismissible?: boolean
  closeOnOutside?: boolean
  portalTo?: string | HTMLElement
}>(), { showTrigger: true, disabled: false, dismissible: true, closeOnOutside: true })
const emit = defineEmits<{ openAutoFocus: [event: Event], closeAutoFocus: [event: Event] }>()
defineSlots<{
  trigger?: () => unknown
  default?: (scope: { close: () => void }) => unknown
  footer?: (scope: { close: () => void }) => unknown
}>()
const model = defineModel<boolean>({ default: false })
const slots = useSlots()
const scope = useTemplateRef<HTMLElement>('scope')
const target = usePortalTarget(scope)
const focusReturn = useFocusReturn(model, () => props.returnFocus, () => !props.showTrigger)
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
  if (!props.dismissible || !props.closeOnOutside)
    event.preventDefault()
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
        <slot name="trigger">
          {{ triggerLabel ?? title }}
        </slot>
      </DialogTrigger>
      <DialogPortal
        :to="portalTo ?? target"
        :disabled="!portalTo && !target"
      >
        <DialogOverlay class="ui-dialog-overlay" />
        <DialogContent
          v-bind="description ? $attrs : { ...$attrs, 'aria-describedby': undefined }"
          class="ui-dialog-content"
          @interact-outside="outside"
          @open-auto-focus="opening"
          @close-auto-focus="closing"
          @escape-key-down="!dismissible && $event.preventDefault()"
        >
          <header class="ui-dialog-header">
            <DialogTitle class="ui-dialog-title">
              {{ title }}
            </DialogTitle>
            <DialogDescription
              v-if="description"
              class="ui-dialog-description"
            >
              {{ description }}
            </DialogDescription>
          </header>
          <DialogClose
            v-if="dismissible"
            class="ui-overlay-close"
            :aria-label="closeLabel"
          >
            <span aria-hidden="true">×</span>
          </DialogClose>
          <div class="ui-dialog-body">
            <slot :close="close" />
          </div>
          <footer
            v-if="slots.footer"
            class="ui-dialog-footer"
          >
            <slot
              name="footer"
              :close="close"
            />
          </footer>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
