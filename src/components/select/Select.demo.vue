<script setup lang="ts">
import type { ChoiceOption } from '../../vue'
import { ref } from 'vue'
import Select from './Select.vue'

const options: ChoiceOption[] = [
  { value: 'quiet', label: 'Quiet' },
  { value: 'plain', label: 'Plain' },
  { value: 'loud', label: 'Loud' },
]

const tone = ref('plain')
const accents = ['#62b66c', 'rgb(54 130 224)', 'hsl(285 55% 50%)', 'oklch(65% 0.16 45)', 'color(display-p3 0.2 0.65 0.4)', 'var(--ui-fg)']
</script>

<template>
  <Select
    v-model="tone"
    label="Tone"
    :options="options"
  />
  <Select
    v-model="tone"
    label="Framed tone"
    :options="options"
    framed
  />
  <p class="demo-readout">
    {{ tone }}
  </p>
  <Select
    v-for="accent in accents"
    :key="accent"
    v-model="tone"
    :native="false"
    :label="accent"
    :options="options"
    :accent="accent"
  />
</template>
