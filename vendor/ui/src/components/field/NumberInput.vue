<script setup lang="ts">
import { computed } from 'vue'
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })
defineProps<{
  label: string
  min?: number
  max?: number
  step?: number | 'any'
}>()
const model = defineModel<number | undefined>()
const value = computed(() => model.value !== undefined && Number.isFinite(model.value) ? model.value : '')
const { wrapperAttrs, controlAttrs } = useControlAttrs()
function update(event: Event): void {
  const next = (event.currentTarget as HTMLInputElement).valueAsNumber
  model.value = Number.isFinite(next) ? next : undefined
}
</script>

<template>
  <label
    v-bind="wrapperAttrs()"
    class="ui-field"
  >
    <span class="ui-field-label">{{ label }}</span>
    <input
      v-bind="controlAttrs()"
      class="ui-field-control"
      type="number"
      :value="value"
      :min="min"
      :max="max"
      :step="step"
      @input="update"
    >
  </label>
</template>
