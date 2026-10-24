<script setup lang="ts">
import type { FieldControlProps } from '../../vue'
import { computed, useId } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  id?: string
  description?: string
  error?: string
  required?: boolean
}>(), { required: false })
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
  'aria-describedby': [props.description ? descriptionId.value : '', props.error ? errorId.value : ''].filter(Boolean).join(' ') || undefined,
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
      >*</span>
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
