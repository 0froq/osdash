<script setup lang="ts">
import { ref } from 'vue'
import DateInput from './DateInput.vue'

const date = ref('2026-09-30')
</script>

<template>
  <DateInput
    v-model="date"
    label="Publication date"
    name="publication-date"
    min="2026-01-01"
    max="2026-12-31"
  />
  <p class="demo-readout">
    {{ date || 'empty' }}
  </p>
</template>
