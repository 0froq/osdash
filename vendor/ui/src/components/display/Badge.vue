<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'muted' | 'accent' }>(), { tone: 'muted' })
defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <span
    class="ui-badge"
    :class="{ 'is-accent': tone === 'accent' }"
    ><slot
  /></span>
</template>

<style scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  color: var(--ui-muted);
  font-family: var(--ui-font-meta);
  font-size: 10px;
  line-height: 1.5;
}

.ui-badge.is-accent {
  border-color: color-mix(in srgb, var(--ui-accent) 30%, var(--ui-line));
  background: color-mix(in srgb, var(--ui-accent) 6%, transparent);
  color: var(--ui-accent);
}
</style>
