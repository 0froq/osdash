<script setup lang="ts">
import { ref } from 'vue'
import Slider from './Slider.vue'

const value = ref(40)
</script>

<template>
  <Slider
    v-model="value"
    label="Preview opacity"
    name="opacity"
    :step="5"
    :aria-valuetext="`${value} percent`"
  />
  <p class="demo-readout">
    {{ value }}%
  </p>
</template>
