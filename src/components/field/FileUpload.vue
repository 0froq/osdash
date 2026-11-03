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
  if (input.value) input.value.value = ''
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
    />
  </label>
</template>

<style scoped>
.ui-file-control {
  box-sizing: border-box;
  width: 100%;
  padding: 8px 0;
  border: 0;
  border-bottom: 1px solid var(--ui-line);
  background: none;
  color: var(--ui-muted);
  font-family: var(--ui-font-text);
  font-size: 14px;
}

.ui-file-control::file-selector-button {
  margin-inline-end: 12px;
  padding: 4px 8px;
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  color: var(--ui-fg);
  font: inherit;
  cursor: pointer;
}

.ui-file-control:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 4px;
}

.ui-file-control:disabled,
.ui-file-control:disabled::file-selector-button {
  color: var(--ui-muted);
  cursor: not-allowed;
}

.ui-field {
  display: grid;
  gap: 8px;
  max-width: 20rem;
}

.ui-field-label {
  color: var(--ui-muted);
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
