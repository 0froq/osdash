<script setup lang="ts">
export type DesignStatus = 'ai-draft' | 'reviewed' | 'stable'

const props = withDefaults(
  defineProps<{
    explain?: boolean
    status?: DesignStatus
  }>(),
  { explain: false, status: 'ai-draft' },
)

const { t } = useI18n()

const label = computed(() => {
  switch (props.status) {
    case 'ai-draft':
      return t('components.status.ai-draft')
    case 'reviewed':
      return t('components.status.reviewed')
    case 'stable':
      return t('components.status.stable')
    default: {
      const unreachable: never = props.status
      return unreachable
    }
  }
})

const description = computed(() => {
  switch (props.status) {
    case 'ai-draft':
      return t('components.statusDescription.ai-draft')
    case 'reviewed':
      return t('components.statusDescription.reviewed')
    case 'stable':
      return t('components.statusDescription.stable')
    default: {
      const unreachable: never = props.status
      return unreachable
    }
  }
})
</script>

<template>
  <span class="design-status">
    <span
      class="design-status-badge"
      :title="description"
      >{{ label }}</span
    >
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
</style>
