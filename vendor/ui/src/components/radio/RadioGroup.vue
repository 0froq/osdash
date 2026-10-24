<script setup lang="ts" generic="T extends string">
import type { ChoiceOption } from '../../vue'
import { useId } from 'vue'

withDefaults(defineProps<{
  label: string
  options: ChoiceOption<T>[]
  name?: string
  disabled?: boolean
  required?: boolean
  form?: string
}>(), { disabled: false, required: false })
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
      >
      <span>{{ option.label }}</span>
    </label>
  </fieldset>
</template>
