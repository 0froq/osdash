<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })
const props = defineProps<{
  label: string
  resetKey?: string | number
}>()
const emit = defineEmits<{ change: [files: File[]] }>()
const input = useTemplateRef<HTMLInputElement>('input')
const { wrapperAttrs, controlAttrs } = useControlAttrs()
function change(event: Event): void {
  emit('change', Array.from((event.currentTarget as HTMLInputElement).files ?? []))
}
function clear(): void {
  if (input.value)
    input.value.value = ''
  emit('change', [])
}
watch(() => props.resetKey, clear)
defineExpose({ clear })
</script>

<template>
  <label
    v-bind="wrapperAttrs()"
    class="ui-field"
  >
    <span class="ui-field-label">{{ label }}</span>
    <input
      ref="input"
      v-bind="controlAttrs()"
      class="ui-file-control"
      type="file"
      @change="change"
    >
  </label>
</template>
