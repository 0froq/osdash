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

<style scoped>
.ui-spinner {
  display: inline-flex;
  width: 1em;
  height: 1em;
  color: var(--ui-accent);
  vertical-align: middle;
}

.ui-spinner-ring {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border: 1.5px solid var(--ui-line);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: ui-spinner-turn 0.9s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .ui-spinner-ring {
    animation: none;
  }
}

@keyframes ui-spinner-turn {
  to {
    transform: rotate(360deg);
  }
}
</style>
