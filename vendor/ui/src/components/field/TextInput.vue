<script setup lang="ts">
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  label: string
  type?: 'text' | 'email' | 'search'
}>(), {
  type: 'text',
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
    <input
      v-bind="controlAttrs()"
      v-model="model"
      class="ui-field-control"
      :type="type"
    >
  </label>
</template>
