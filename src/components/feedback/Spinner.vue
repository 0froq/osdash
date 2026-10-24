<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <span
    class="ui-spinner"
    role="status"
    :aria-label="label"
  >
    <span
      class="ui-spinner-ring"
      aria-hidden="true"
    />
  </span>
</template>
