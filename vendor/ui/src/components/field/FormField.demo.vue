<script setup lang="ts">
import { computed, ref } from 'vue'
import FormField from './FormField.vue'

const value = ref('')
const touched = ref(false)
const error = computed(() =>
  touched.value && !value.value.trim() ? 'Enter a document title.' : undefined,
)
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
        class="demo-control"
        type="text"
        name="title"
        @blur="touched = true"
      />
    </template>
  </FormField>
</template>

<style scoped>
.demo-control {
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

.demo-control:focus {
  border-bottom-color: var(--ui-accent);
  outline: none;
}

.demo-control[aria-invalid='true'] {
  border-bottom-color: var(--ui-accent);
  color: var(--ui-accent);
}
</style>
