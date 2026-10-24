<script setup lang="ts">
import Separator from './Separator.vue'
</script>

<template>
  <div style="display: grid; gap: 16px; width: 100%">
    <span>Editorial</span>
    <Separator />
    <div style="display: flex; gap: 16px; align-items: center">
      <span>Notes</span>
      <Separator orientation="vertical" />
      <span>Archive</span>
    </div>
  </div>
</template>
