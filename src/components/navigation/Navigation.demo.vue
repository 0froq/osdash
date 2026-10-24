<script setup lang="ts">
import { ref } from 'vue'
import Navigation from './Navigation.vue'

const active = ref('guide')
const items = [
  { value: 'guide', label: 'Guide' },
  { value: 'components', label: 'Components' },
  { value: 'changelog', label: 'Changelog' },
]
</script>

<template>
  <Navigation
    v-model="active"
    :items="items"
    aria-label="Example navigation"
  />
  <p class="demo-readout">
    {{ active }}
  </p>
</template>
