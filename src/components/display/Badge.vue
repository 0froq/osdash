<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'muted' | 'accent' }>(), { tone: 'muted' })
defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <span
    class="ui-badge"
    :class="{ 'is-accent': tone === 'accent' }"
  ><slot /></span>
</template>
