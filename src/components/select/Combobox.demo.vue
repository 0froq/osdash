<script setup lang="ts">
import { ref } from 'vue'
import Combobox from './Combobox.vue'

type Framework = 'vue' | 'react' | 'svelte' | 'angular'
const single = ref<Framework | ''>('vue')
const multiple = ref<Framework[]>(['vue'])
const options = [
  { value: 'vue', label: 'Vue' },
  { value: 'react', label: 'React' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'angular', label: 'Angular', disabled: true },
]
</script>

<template>
  <div style="display: grid; gap: 24px; width: min(100%, 320px)">
    <Combobox
      v-model="single"
      label="Framework"
      :options="options"
      toggle-label="Toggle options"
      clear-label="Clear selection"
      empty-label="No matching options"
      placeholder="Search frameworks"
    />
    <Combobox
      v-model="multiple"
      multiple
      label="Frameworks"
      :options="options"
      toggle-label="Toggle options"
      clear-label="Clear selections"
      empty-label="No matching options"
      placeholder="Add frameworks"
    />
  </div>
</template>
