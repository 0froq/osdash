<script setup lang="ts" generic="T extends string | string[] = string | string[]">
import type { ChoiceOption } from '../../vue'
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import { computed, useId } from 'vue'
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  label: string
  options: ChoiceOption[]
  type?: 'single' | 'multiple'
  orientation?: 'horizontal' | 'vertical'
  dir?: 'ltr' | 'rtl'
  loop?: boolean
  disabled?: boolean
}>(), { type: 'single', orientation: 'horizontal', loop: true, disabled: false })
defineSlots<{ option?: (scope: { option: ChoiceOption, active: boolean }) => unknown }>()
type ModelValue = T extends string[] ? T : T | ''
const model = defineModel<ModelValue>({ default: () => '' as ModelValue })
const id = useId()
const { wrapperAttrs, controlAttrs } = useControlAttrs()
const value = computed<string | string[]>(() => {
  const selected = model.value as string | string[]
  return props.type === 'multiple'
    ? Array.isArray(selected) ? selected : selected ? [selected] : []
    : Array.isArray(selected) ? selected[0] ?? '' : selected
})
function active(option: ChoiceOption): boolean {
  return Array.isArray(value.value) ? value.value.includes(option.value) : value.value === option.value
}
function update(next: unknown) {
  if (props.disabled)
    return
  model.value = (props.type === 'multiple'
    ? Array.isArray(next) ? next.filter((item): item is string => typeof item === 'string') : []
    : typeof next === 'string' ? next : '') as ModelValue
}
</script>

<template>
  <div
    v-bind="wrapperAttrs()"
    class="ui-toggle-group-field"
  >
    <span
      :id="id"
      class="ui-field-label"
    >{{ label }}</span>
    <ToggleGroupRoot
      v-bind="controlAttrs()"
      class="ui-toggle-group"
      :aria-labelledby="id"
      :type="type"
      :orientation="orientation"
      :dir="dir"
      :loop="loop"
      :disabled="disabled"
      :model-value="value"
      @update:model-value="update"
    >
      <ToggleGroupItem
        v-for="option in options"
        :key="option.value"
        class="ui-toggle-group-item"
        :value="option.value"
        :disabled="option.disabled"
      >
        <slot
          name="option"
          :option="option"
          :active="active(option)"
        >
          {{ option.label }}
        </slot>
      </ToggleGroupItem>
    </ToggleGroupRoot>
  </div>
</template>
