<script setup lang="ts">
import { computed } from 'vue'
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  label: string
  min?: number
  max?: number
  step?: number | 'any'
}>(), { min: 0, max: 100, step: 1 })
const model = defineModel<number>({ default: 50 })
const { wrapperAttrs, controlAttrs } = useControlAttrs()
const minimum = computed(() => Number.isFinite(props.min) ? props.min : 0)
const maximum = computed(() => Number.isFinite(props.max) ? Math.max(minimum.value, props.max) : Math.max(minimum.value, 100))
const increment = computed(() => props.step === 'any' ? 'any' : Number.isFinite(props.step) && props.step > 0 ? props.step : 1)
const value = computed(() => Number.isFinite(model.value)
  ? Math.min(maximum.value, Math.max(minimum.value, model.value))
  : minimum.value / 2 + maximum.value / 2)
function update(event: Event): void {
  const next = (event.currentTarget as HTMLInputElement).valueAsNumber
  if (Number.isFinite(next))
    model.value = next
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
      class="ui-slider-control"
      type="range"
      :value="value"
      :min="minimum"
      :max="maximum"
      :step="increment"
      @input="update"
    >
  </label>
</template>
