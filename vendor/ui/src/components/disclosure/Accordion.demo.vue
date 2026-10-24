<script setup lang="ts">
import { ref } from 'vue'
import Accordion from './Accordion.vue'

const open = ref<string[]>(['fonts'])
const items = [{ value: 'fonts', label: 'Who loads the fonts?' }, { value: 'routes', label: 'Who owns the routes?' }]
</script>

<template>
  <Accordion
    v-model="open"
    :items="items"
  >
    <template #default="{ item }">
      <p>{{ item.value === 'fonts' ? 'The consuming application supplies fonts.' : 'Navigation accepts data and slots, not a router dependency.' }}</p>
    </template>
  </Accordion>
</template>
