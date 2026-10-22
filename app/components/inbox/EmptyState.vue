<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <p class="empty-state">{{ text }}</p>
</template>
