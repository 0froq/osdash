<script setup lang="ts" generic="T extends string">
import type { ChoiceOption } from '../../vue'
import { useId } from 'vue'

withDefaults(
  defineProps<{
    label: string
    options: ChoiceOption<T>[]
    name?: string
    disabled?: boolean
    required?: boolean
    form?: string
  }>(),
  { disabled: false, required: false },
)
const model = defineModel<T>()
const id = useId()
</script>

<template>
  <fieldset
    class="ui-radio-group"
    :disabled="disabled"
  >
    <legend class="ui-field-label">
      {{ label }}
    </legend>
    <label
      v-for="option in options"
      :key="option.value"
      class="ui-radio-option"
    >
      <input
        v-model="model"
        type="radio"
        :name="name || id"
        :form="form"
        :value="option.value"
        :required="required"
        :disabled="option.disabled"
      />
      <span>{{ option.label }}</span>
    </label>
  </fieldset>
</template>

<style scoped>
.ui-radio-group {
  display: grid;
  gap: 10px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
  font-size: 15px;
}

.ui-radio-group :deep(legend) {
  margin-block-end: 12px;
  padding: 0;
}

.ui-radio-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.ui-radio-option :deep(input) {
  flex: none;
  margin: 0;
  accent-color: var(--ui-accent);
}

.ui-radio-option :deep(input:focus-visible) {
  outline: 1px solid var(--ui-accent);
  outline-offset: 3px;
}

.ui-radio-option:has(input:disabled) {
  color: var(--ui-muted);
  cursor: not-allowed;
}

.ui-field-label {
  color: var(--ui-muted);
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
