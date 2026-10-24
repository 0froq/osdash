<script setup lang="ts">
import Button from './Button.vue'

withDefaults(defineProps<{
  label: string
  type?: 'button' | 'submit' | 'reset'
}>(), { type: 'button' })
defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <Button
    class="ui-icon-button"
    :type="type"
    :aria-label="label"
  >
    <span
      class="ui-icon-button-glyph"
      aria-hidden="true"
    ><slot /></span>
  </Button>
</template>
