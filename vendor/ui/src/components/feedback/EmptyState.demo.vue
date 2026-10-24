<script setup lang="ts">
import Button from '../button/Button.vue'
import EmptyState from './EmptyState.vue'
</script>

<template>
  <EmptyState
    title="Nothing bookmarked yet"
    description="Save a page to find it here later."
  >
    <template #actions>
      <Button>Explore documents</Button>
    </template>
  </EmptyState>
</template>
