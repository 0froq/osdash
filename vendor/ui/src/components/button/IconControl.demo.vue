<script setup lang="ts">
import { ref } from 'vue'
import IconControl from './IconControl.vue'

const saved = ref(false)
</script>

<template>
  <IconControl
    :label="saved ? 'Remove bookmark' : 'Bookmark document'"
    :aria-pressed="saved"
    @click="saved = !saved"
  >
    <svg
      viewBox="0 0 24 24"
      :fill="saved ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="1.5"
    ><path d="M6 3h12v18l-6-4-6 4z" /></svg>
  </IconControl>
</template>
