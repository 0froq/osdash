<script setup lang="ts">
import { ref } from 'vue'
import Checkbox from './Checkbox.vue'

const kept = ref(true)
</script>

<template>
  <p class="demo-sentence">
    <Checkbox
      v-model="kept"
      label="Keep the margin"
    />
  </p>
  <p class="demo-readout">
    {{ kept ? 'kept' : 'dropped' }}
  </p>
</template>
