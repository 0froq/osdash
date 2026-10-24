<script setup lang="ts">
import type { CollapsibleTriggerProps } from '../../vue'
import { computed, useId, useTemplateRef, watch } from 'vue'
import { useDisclosure } from '../../vue'

const props = withDefaults(defineProps<{
  label: string
  disabled?: boolean
}>(), { disabled: false })
defineSlots<{
  trigger?: (scope: { open: boolean, props: CollapsibleTriggerProps }) => unknown
  default?: (scope: { open: boolean }) => unknown
}>()
const model = defineModel<boolean>({ default: false })
const id = useId()
const triggerId = `${id}-trigger`
const panelId = `${id}-panel`
const panel = useTemplateRef<HTMLElement>('panel')
const { toggle } = useDisclosure(model, () => props.disabled)
const triggerProps = computed<CollapsibleTriggerProps>(() => ({
  'id': triggerId,
  'type': 'button',
  'class': 'ui-collapsible-trigger',
  'disabled': props.disabled,
  'aria-expanded': model.value,
  'aria-controls': panelId,
  'onClick': toggle,
}))

// Default pre-flush runs before the panel becomes hidden. Never steal outside focus.
watch(model, (open) => {
  if (!open && typeof document !== 'undefined' && panel.value?.contains(document.activeElement))
    document.getElementById(triggerId)?.focus()
})
</script>

<template>
  <div
    class="ui-collapsible"
    :class="{ 'is-open': model }"
  >
    <slot
      name="trigger"
      :open="model"
      :props="triggerProps"
    >
      <button v-bind="triggerProps">
        <span>{{ label }}</span>
        <span
          class="ui-collapsible-chevron"
          aria-hidden="true"
        />
      </button>
    </slot>
    <div
      :id="panelId"
      ref="panel"
      class="ui-collapsible-panel"
      :hidden="!model"
      :inert="model ? undefined : true"
      :aria-hidden="model ? undefined : true"
    >
      <div class="ui-collapsible-clip">
        <div class="ui-collapsible-body">
          <slot :open="model" />
        </div>
      </div>
    </div>
  </div>
</template>
