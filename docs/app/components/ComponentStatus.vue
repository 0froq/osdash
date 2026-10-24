<script setup lang="ts">
withDefaults(defineProps<{
  explain?: boolean
}>(), { explain: false })

const { t } = useI18n()
</script>

<template>
  <span class="design-status">
    <span
      class="design-status-badge"
      :title="t('components.draftDescription')"
    >{{ t('components.draft') }}</span>
    <span
      v-if="explain"
      class="design-status-description"
    >{{ t('components.draftDescription') }}</span>
  </span>
</template>

<style scoped>
.design-status {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 12px;
  vertical-align: middle;
  font-weight: 400;
  line-height: 1.5;
}

.design-status-badge {
  flex-shrink: 0;
  padding: 2px 7px;
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  color: var(--ui-muted);
  font-family: var(--ui-font-meta);
  font-size: 10px;
  white-space: nowrap;
}

.design-status-description {
  max-width: 38rem;
  color: var(--ui-muted);
  font-family: var(--ui-font-text);
  font-size: 13px;
}
</style>
