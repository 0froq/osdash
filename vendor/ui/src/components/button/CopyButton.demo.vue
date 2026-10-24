<script setup lang="ts">
import CopyButton from './CopyButton.vue'
</script>

<template>
  <CopyButton
    text="pnpm dev"
    label="Copy command"
    pending-label="Copying command"
    copied-label="Command copied"
    error-label="Could not copy"
  />
</template>
