<script setup lang="ts">
import { computed, ref } from 'vue'
import FormField from './FormField.vue'

const value = ref('')
const touched = ref(false)
const error = computed(() => touched.value && !value.value.trim() ? 'Enter a document title.' : undefined)
</script>

<template>
  <FormField
    label="Document title"
    description="Shown in navigation and search."
    :error="error"
    required
  >
    <template #default="{ controlProps }">
      <input
        v-bind="controlProps"
        v-model="value"
        class="ui-field-control"
        type="text"
        name="title"
        @blur="touched = true"
      >
    </template>
  </FormField>
</template>
