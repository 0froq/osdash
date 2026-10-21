<template>
  <div
    class="inbox-shell"
    :data-mobile="mobile ? '1' : '0'"
  >
    <slot name="sidebar" />
    <div class="inbox-main">
      <slot />
    </div>
    <slot name="preview" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ mobile: boolean }>()
</script>
