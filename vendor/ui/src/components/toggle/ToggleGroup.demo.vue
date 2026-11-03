<script setup lang="ts">
import { ref } from 'vue'
import ToggleGroup from './ToggleGroup.vue'

const alignment = ref<'' | 'left' | 'center' | 'right'>('left')
const emphasis = ref<('italic' | 'underline' | 'strike')[]>(['italic'])
</script>

<template>
  <div class="ui-toggle-group-demo">
    <ToggleGroup
      v-model="alignment"
      label="Alignment"
      :options="[
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ]"
    />
    <ToggleGroup
      v-model="emphasis"
      type="multiple"
      label="Emphasis"
      :options="[
        { value: 'italic', label: 'Italic' },
        { value: 'underline', label: 'Underline' },
        { value: 'strike', label: 'Strike', disabled: true },
      ]"
    />
  </div>
</template>

<style scoped>
.ui-toggle-group-demo {
  display: grid;
  gap: 24px;
}
</style>
