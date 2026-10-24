<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ demo?: Component }>()
const { t } = useI18n()
</script>

<template>
  <div class="demo-card">
    <component
      :is="demo"
      v-if="demo"
    />
    <p
      v-else
      class="demo-missing"
    >
      {{ t('components.noDemo') }}
    </p>
  </div>
</template>

<style scoped>
.demo-card {
  margin: 1.4em 0 1.6em;
  padding: 22px 0 4px;
  color: var(--ui-fg);
  border-top: 1px solid var(--ui-line);
  font-family: var(--ui-font-text);
}

.demo-card :deep(.demo-sentence) {
  margin: 0;
  font-family: var(--ui-font-display);
  font-size: clamp(26px, 4vw, 36px);
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.demo-card :deep(.demo-readout),
.demo-missing {
  margin: 14px 0 0;
  color: var(--ui-muted);
  font-family: var(--ui-font-meta);
  font-size: 12px;
}
</style>
