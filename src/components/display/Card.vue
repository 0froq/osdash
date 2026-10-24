<script setup lang="ts">
defineSlots<{
  header?: () => unknown
  default?: () => unknown
  footer?: () => unknown
}>()
</script>

<template>
  <div class="ui-card">
    <div
      v-if="$slots.header"
      class="ui-card-header"
    >
      <slot name="header" />
    </div>
    <div class="ui-card-body">
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="ui-card-footer"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
