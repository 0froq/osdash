<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <p class="empty-state">{{ text }}</p>
</template>

<style scoped>
.empty-state {
  padding: 32px 12px 0;
  color: var(--muted);
  font-size: 14px;
}

@media (max-width: 760px) {
  .empty-state {
    padding-right: 4px;
    padding-left: 4px;
  }
}
</style>
