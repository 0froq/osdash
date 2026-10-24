<script setup lang="ts">
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'reka-ui'
import { useSlots, useTemplateRef } from 'vue'
import { usePortalTarget } from '../../vue'
import Button from '../button/Button.vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  title: string
  description: string
  cancelLabel: string
  confirmLabel: string
  triggerLabel?: string
  disabled?: boolean
  pending?: boolean
  confirmDisabled?: boolean
  portalTo?: string | HTMLElement
}>(), { disabled: false, pending: false, confirmDisabled: false })
const emit = defineEmits<{ confirm: [event: MouseEvent] }>()
defineSlots<{
  trigger?: () => unknown
  default?: () => unknown
}>()
const model = defineModel<boolean>({ default: false })
const slots = useSlots()
const scope = useTemplateRef<HTMLElement>('scope')
const target = usePortalTarget(scope)
function confirm(event: MouseEvent) {
  if (props.pending || props.confirmDisabled)
    return
  emit('confirm', event)
  if (!event.defaultPrevented)
    model.value = false
}
</script>

<template>
  <div
    ref="scope"
    class="ui-overlay-scope"
  >
    <AlertDialogRoot v-model:open="model">
      <AlertDialogTrigger
        :as-child="Boolean(slots.trigger)"
        :disabled="disabled"
        class="ui-overlay-trigger"
      >
        <slot name="trigger">
          {{ triggerLabel ?? title }}
        </slot>
      </AlertDialogTrigger>
      <AlertDialogPortal
        :to="portalTo ?? target"
        :disabled="!portalTo && !target"
      >
        <AlertDialogOverlay class="ui-dialog-overlay" />
        <AlertDialogContent
          v-bind="$attrs"
          class="ui-dialog-content ui-alert-dialog-content"
          :aria-busy="pending || undefined"
        >
          <header class="ui-dialog-header">
            <AlertDialogTitle class="ui-dialog-title">
              {{ title }}
            </AlertDialogTitle>
            <AlertDialogDescription class="ui-dialog-description">
              {{ description }}
            </AlertDialogDescription>
          </header>
          <div
            v-if="slots.default"
            class="ui-dialog-body"
          >
            <slot />
          </div>
          <footer class="ui-dialog-footer">
            <AlertDialogCancel as-child>
              <Button>{{ cancelLabel }}</Button>
            </AlertDialogCancel>
            <Button
              class="ui-alert-dialog-confirm"
              :disabled="pending || confirmDisabled"
              @click="confirm"
            >
              {{ confirmLabel }}
            </Button>
          </footer>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>
  </div>
</template>
