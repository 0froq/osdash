<script setup lang="ts">
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })

defineProps<{
  label: string
}>()

const model = defineModel<boolean>({ default: false })
const { wrapperAttrs, controlAttrs } = useControlAttrs()
</script>

<template>
  <label
    v-bind="wrapperAttrs()"
    class="ui-check"
  >
    <input
      v-bind="controlAttrs()"
      v-model="model"
      type="checkbox"
      class="ui-check-input"
    >
    <span
      class="ui-check-mark"
      aria-hidden="true"
    />
    <span>{{ label }}</span>
  </label>
</template>
