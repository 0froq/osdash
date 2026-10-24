<script setup lang="ts">
import { ref } from 'vue'
import RadioGroup from './RadioGroup.vue'

const value = ref('public')
const options = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'team', label: 'Team', disabled: true },
]
</script>

<template>
  <RadioGroup
    v-model="value"
    :options="options"
    label="Visibility"
    name="visibility"
    required
  />
  <p class="demo-readout">
    {{ value }}
  </p>
</template>
