<script setup lang="ts">
import { computed, useSlots } from 'vue'
import Dialog from './Dialog.vue'

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
  side?: 'left' | 'right' | 'bottom'
}>(), { side: 'right', showTrigger: true, disabled: false, dismissible: true, closeOnOutside: true })
defineSlots<{
  trigger?: () => unknown
  default?: (scope: { close: () => void }) => unknown
  footer?: (scope: { close: () => void }) => unknown
}>()
const model = defineModel<boolean>({ default: false })
const slots = useSlots()
const dialogProps = computed(() => {
  const { side: _, ...rest } = props
  return rest
})
</script>

<template>
  <Dialog
    v-bind="{ ...$attrs, ...dialogProps }"
    v-model="model"
    class="ui-drawer-content"
    :data-side="side"
  >
    <template
      v-if="slots.trigger"
      #trigger
    >
      <slot name="trigger" />
    </template>
    <template #default="{ close }">
      <slot :close="close" />
    </template>
    <template
      v-if="slots.footer"
      #footer="{ close }"
    >
      <slot
        name="footer"
        :close="close"
      />
    </template>
  </Dialog>
</template>
