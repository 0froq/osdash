<script setup lang="ts">
import { ref } from 'vue'
import DatePicker from './DatePicker.vue'

const date = ref('')
</script>

<template>
  <DatePicker
    v-model="date"
    label="Example date"
    locale="en-US"
    initial-date="2026-09-01"
    placeholder="Choose a date"
    prev-label="Previous month"
    next-label="Next month"
    clear-label="Clear date"
    close-label="Close calendar"
    style="width: min(100%, 320px)"
  />
</template>
