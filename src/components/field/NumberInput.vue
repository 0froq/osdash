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
const value = computed(() =>
  model.value !== undefined && Number.isFinite(model.value) ? model.value : '',
)
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
    />
  </label>
</template>

<style scoped>
.ui-field-control[aria-invalid='true'] {
  color: var(--ui-accent);
  border-bottom-color: var(--ui-accent);
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

.ui-field-control {
  width: 100%;
  padding: 8px 0;
  border: 0;
  border-bottom: 1px solid var(--ui-line);
  border-radius: 0;
  appearance: none;
  background: none;
  color: var(--ui-fg);
  font: inherit;
  font-family: var(--ui-font-text);
  font-size: 16px;
}

.ui-field-control:focus {
  border-bottom-color: var(--ui-accent);
  outline: none;
}

.ui-field-control:disabled {
  color: var(--ui-muted);
  cursor: not-allowed;
}
</style>
