<script setup lang="ts">
defineProps<{
  label: string
  dismissLabel?: string
}>()

const emit = defineEmits<{ dismiss: [] }>()
</script>

<template>
  <section
    class="ui-banner"
    :aria-label="label"
  >
    <div class="ui-banner-content">
      <slot />
    </div>
    <div
      v-if="$slots.actions || dismissLabel"
      class="ui-banner-actions"
    >
      <slot name="actions" />
      <button
        v-if="dismissLabel"
        type="button"
        class="ui-banner-dismiss"
        :aria-label="dismissLabel"
        @click="emit('dismiss')"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.ui-banner {
  position: sticky;
  top: 0;
  z-index: 15;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 24px;
  width: 100%;
  padding: 12px 24px;
  border-bottom: 1px solid var(--ui-line);
  background: var(--ui-faint);
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
}

.ui-banner-content {
  min-width: 0;
  overflow-wrap: anywhere;
}

.ui-banner-content > :deep(:first-child) {
  margin-top: 0;
}

.ui-banner-content > :deep(:last-child) {
  margin-bottom: 0;
}

.ui-banner-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ui-banner :deep(a) {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.ui-banner-dismiss {
  display: inline-grid;
  flex: none;
  width: 28px;
  height: 28px;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--ui-muted);
  cursor: pointer;
  font: inherit;
  font-size: 20px;
}

.ui-banner :deep(a:hover),
.ui-banner-dismiss:hover {
  color: var(--ui-accent);
}

.ui-banner :deep(a:focus-visible),
.ui-banner-dismiss:focus-visible {
  outline: 2px solid var(--ui-accent);
  outline-offset: 3px;
}
</style>
