<script setup lang="ts">
withDefaults(
  defineProps<{
    orientation?: 'horizontal' | 'vertical'
    decorative?: boolean
  }>(),
  { orientation: 'horizontal', decorative: true },
)
</script>

<template>
  <div
    class="ui-separator"
    :class="{ 'is-vertical': orientation === 'vertical' }"
    :role="decorative ? 'presentation' : 'separator'"
    :aria-orientation="decorative ? undefined : orientation"
  />
</template>

<style scoped>
.ui-separator {
  width: 100%;
  height: 1px;
  flex: none;
  background: var(--ui-line);
}

.ui-separator.is-vertical {
  width: 1px;
  height: auto;
  min-height: 1em;
  align-self: stretch;
}
</style>
