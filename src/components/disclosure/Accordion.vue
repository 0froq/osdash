<script setup lang="ts" generic="T extends string">
import type { ChoiceOption } from '../../vue'
import Collapsible from './Collapsible.vue'

const props = withDefaults(defineProps<{
  items: ChoiceOption<T>[]
  multiple?: boolean
  disabled?: boolean
}>(), { multiple: false, disabled: false })
defineSlots<{
  default?: (scope: { item: ChoiceOption<T>, open: boolean }) => unknown
}>()
const model = defineModel<T[]>({ default: () => [] })
function isOpen(value: T) {
  return props.multiple ? model.value.includes(value) : model.value[0] === value
}
function update(value: T, open: boolean) {
  if (props.disabled || props.items.find(item => item.value === value)?.disabled)
    return
  model.value = open
    ? props.multiple ? [...new Set([...model.value, value])] : [value]
    : model.value.filter(item => item !== value)
}
</script>

<template>
  <div class="ui-accordion">
    <Collapsible
      v-for="item in items"
      :key="item.value"
      :model-value="isOpen(item.value)"
      :label="item.label"
      :disabled="disabled || item.disabled"
      @update:model-value="update(item.value, $event)"
    >
      <slot
        :item="item"
        :open="isOpen(item.value)"
      />
    </Collapsible>
  </div>
</template>
