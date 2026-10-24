<script setup lang="ts">
/**
 * Floating menu surface shared by the three menus. It owns only the shell:
 * the paper card, the enter animation and the item hover. Placement stays
 * with the caller, which passes its own class.
 */
const el = ref<HTMLElement>()

defineExpose({ el })
</script>

<template>
  <div
    ref="el"
    class="pop"
    role="menu"
  >
    <slot />
  </div>
</template>

<style scoped>
.pop {
  padding: 4px;
  border-radius: var(--radius-card);
  background: var(--card);
  box-shadow: var(--shadow-pop);
  transform-origin: var(--pop-origin, top left);
  animation: pop-in var(--dur-1) var(--ease) both;
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
}

/* Items arrive through the slot, so they carry the caller's scope attribute. */
.pop :deep(.pop-item) {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  font-size: 13.5px;
  text-align: left;
  transition: background-color var(--dur-1) var(--ease);
}

.pop :deep(.pop-item:hover:not(:disabled)),
.pop :deep(.pop-item:focus-visible) {
  background: var(--soft);
}

.pop :deep(.pop-item:focus-visible) {
  outline-offset: -2px;
}

.pop :deep(.pop-item:disabled) {
  color: var(--muted);
  cursor: default;
}

.pop :deep(.pop-label) {
  margin: 0;
  padding: 10px 10px 4px;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11.5px;
}
</style>
