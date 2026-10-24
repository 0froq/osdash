<script setup lang="ts">
import { ref } from 'vue'
import Toggle from './Toggle.vue'

const on = ref(false)
</script>

<template>
  <p class="demo-sentence">
    Read it <Toggle
      v-model="on"
      label="sound"
      off-label="quiet"
      on-label="aloud"
    />.
  </p>
  <p class="demo-readout">
    {{ on }}
  </p>
</template>
