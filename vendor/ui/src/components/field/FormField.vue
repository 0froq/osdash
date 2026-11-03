<script setup lang="ts">
import type { FieldControlProps } from '../../vue'
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    id?: string
    description?: string
    error?: string
    required?: boolean
  }>(),
  { required: false },
)
defineSlots<{ default?: (scope: { controlProps: FieldControlProps }) => unknown }>()
const generated = useId()
const controlId = computed(() => props.id ?? generated)
const labelId = computed(() => `${controlId.value}-label`)
const descriptionId = computed(() => `${controlId.value}-description`)
const errorId = computed(() => `${controlId.value}-error`)
const controlProps = computed<FieldControlProps>(() => ({
  'id': controlId.value,
  'required': props.required,
  'aria-labelledby': labelId.value,
  'aria-describedby':
    [props.description ? descriptionId.value : '', props.error ? errorId.value : '']
      .filter(Boolean)
      .join(' ') || undefined,
  'aria-invalid': props.error ? true : undefined,
  'aria-required': props.required ? true : undefined,
}))
</script>

<template>
  <div class="ui-form-field">
    <label
      :id="labelId"
      :for="controlId"
      class="ui-field-label"
    >
      {{ label }}
      <span
        v-if="required"
        aria-hidden="true"
        >*</span
      >
    </label>
    <slot :control-props="controlProps" />
    <p
      v-if="description"
      :id="descriptionId"
      class="ui-field-description"
    >
      {{ description }}
    </p>
    <p
      v-if="error"
      :id="errorId"
      class="ui-field-error"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.ui-form-field {
  display: grid;
  gap: 8px;
  max-width: 20rem;
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
}

.ui-field-description,
.ui-field-error {
  margin: 0;
  font-family: var(--ui-font-text);
  font-size: 12px;
  line-height: 1.5;
}

.ui-field-description {
  color: var(--ui-muted);
}

.ui-field-error {
  color: var(--ui-accent);
  border-bottom-color: var(--ui-accent);
}

.ui-field-label {
  color: var(--ui-muted);
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
