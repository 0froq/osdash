<script setup lang="ts">
import { ref } from 'vue'
import Calendar from './Calendar.vue'

const date = ref('2026-09-15')
</script>

<template>
  <Calendar
    v-model="date"
    label="Example date"
    locale="en-US"
    initial-date="2026-09-01"
    today="2026-09-01"
    min="2026-09-01"
    max="2026-12-31"
    prev-label="Previous month"
    next-label="Next month"
  />
</template>
