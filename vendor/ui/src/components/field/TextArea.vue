<script setup lang="ts">
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  label: string
  rows?: number
}>(), {
  rows: 3,
})

const model = defineModel<string>({ default: '' })
const { wrapperAttrs, controlAttrs } = useControlAttrs()
</script>

<template>
  <label
    v-bind="wrapperAttrs()"
    class="ui-field"
  >
    <span class="ui-field-label">{{ label }}</span>
    <textarea
      v-bind="controlAttrs()"
      v-model="model"
      class="ui-field-control ui-field-area"
      :rows="rows"
    />
  </label>
</template>
