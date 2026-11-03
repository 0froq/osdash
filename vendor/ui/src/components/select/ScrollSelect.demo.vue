<script setup lang="ts">
import type { ChoiceOption } from '../../vue'
import { ref } from 'vue'
import ScrollSelect from './ScrollSelect.vue'

const options: ChoiceOption[] = [
  { value: 'quiet', label: 'Quiet' },
  { value: 'plain', label: 'Plain' },
  { value: 'loud', label: 'Loud' },
]

const withDisabled: ChoiceOption[] = [
  { value: 'quiet', label: 'Quiet' },
  { value: 'plain', label: 'Plain', disabled: true },
  { value: 'loud', label: 'Loud' },
]

const tone = ref('plain')
</script>

<template>
  <ScrollSelect
    v-model="tone"
    label="Tone"
    :options="options"
  />
  <ScrollSelect
    v-model="tone"
    label="Hover wheel tone"
    :options="options"
    wheel="hover"
    hide-label
  />
  <ScrollSelect
    v-model="tone"
    label="Disabled option"
    :options="withDisabled"
  />
  <p class="demo-readout">
    {{ tone }}
  </p>
</template>
