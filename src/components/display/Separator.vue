<script setup lang="ts">
withDefaults(defineProps<{
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}>(), { orientation: 'horizontal', decorative: true })
</script>

<template>
  <div
    class="ui-separator"
    :class="{ 'is-vertical': orientation === 'vertical' }"
    :role="decorative ? 'presentation' : 'separator'"
    :aria-orientation="decorative ? undefined : orientation"
  />
</template>
