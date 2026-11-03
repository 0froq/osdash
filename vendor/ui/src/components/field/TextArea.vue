<script setup lang="ts">
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    label: string
    rows?: number
  }>(),
  {
    rows: 3,
  },
)

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

.ui-field-area {
  min-height: 5.5em;
  resize: vertical;
}
</style>
