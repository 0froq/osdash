<script setup lang="ts">
import { ref } from 'vue'
import Tabs from './Tabs.vue'

const value = ref('overview')
const items = [
  { value: 'overview', label: 'Overview' },
  { value: 'details', label: 'Details' },
  { value: 'archive', label: 'Archive', disabled: true },
]
</script>

<template>
  <Tabs
    v-model="value"
    label="Project information"
    :items="items"
  >
    <template #default="{ item }">
      <p>{{ item.value === 'overview' ? 'A small, independent UI library.' : 'Tokens, behavior, and a deliberate skin.' }}</p>
    </template>
  </Tabs>
</template>
