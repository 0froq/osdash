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

<style scoped>
.ui-card {
  overflow: hidden;
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
}

.ui-card-header,
.ui-card-body,
.ui-card-footer {
  padding: 16px 20px;
}

.ui-card-header,
.ui-card-body:has(+ .ui-card-footer) {
  border-bottom: 1px solid var(--ui-line);
}

.ui-card-header > :deep(:first-child),
.ui-card-body > :deep(:first-child),
.ui-card-footer > :deep(:first-child) {
  margin-top: 0;
}

.ui-card-header > :deep(:last-child),
.ui-card-body > :deep(:last-child),
.ui-card-footer > :deep(:last-child) {
  margin-bottom: 0;
}
</style>
