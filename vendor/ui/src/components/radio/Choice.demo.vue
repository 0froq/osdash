<script setup lang="ts">
import { ref } from 'vue'
import Choice from './Choice.vue'

type Tone = 'quiet' | 'plain' | 'loud'

const tone = ref<Tone>('plain')
const options: { value: Tone, label: string }[] = [
  { value: 'quiet', label: 'quiet' },
  { value: 'plain', label: 'plain' },
  { value: 'loud', label: 'loud' },
]
</script>

<template>
  <Choice
    v-model="tone"
    label="Tone"
    :options="options"
  />
  <p class="demo-readout">
    {{ tone }}
  </p>
</template>
