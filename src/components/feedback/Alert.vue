<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string
    announcement?: 'polite' | 'assertive' | 'off'
    dismissLabel?: string
  }>(),
  { announcement: 'polite' },
)
const emit = defineEmits<{ dismiss: [] }>()
</script>

<template>
  <div
    class="ui-alert"
    :role="
      props.announcement === 'off'
        ? undefined
        : props.announcement === 'assertive'
          ? 'alert'
          : 'status'
    "
    :aria-atomic="props.announcement === 'off' ? undefined : true"
  >
    <div class="ui-alert-content">
      <p
        v-if="title"
        class="ui-alert-title"
      >
        {{ title }}
      </p>
      <div class="ui-alert-description">
        <slot />
      </div>
    </div>
    <button
      v-if="dismissLabel"
      type="button"
      class="ui-alert-dismiss"
      :aria-label="dismissLabel"
      @click="emit('dismiss')"
    >
      <span aria-hidden="true">×</span>
    </button>
  </div>
</template>

<style scoped>
.ui-alert {
  display: flex;
  align-items: start;
  gap: 20px;
  padding: 16px 20px;
  border: 1px solid var(--ui-line);
  border-inline-start: 3px solid var(--ui-accent);
  border-radius: var(--ui-radius);
  background: color-mix(in srgb, var(--ui-fg) 3%, transparent);
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
}

.ui-alert-content {
  flex: 1;
  min-width: 0;
}

.ui-alert-title {
  margin: 0 0 6px;
  font: inherit;
}

.ui-alert-description {
  color: var(--ui-muted);
  font-size: 0.9em;
  line-height: 1.5;
}

.ui-alert-description > :deep(:first-child) {
  margin-top: 0;
}

.ui-alert-description > :deep(:last-child) {
  margin-bottom: 0;
}

.ui-alert-dismiss {
  flex: none;
  padding: 0 4px;
  border: 0;
  background: none;
  color: var(--ui-muted);
  cursor: pointer;
  font: inherit;
}

.ui-alert-dismiss:hover {
  color: var(--ui-fg);
}

.ui-alert-dismiss:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 4px;
}
</style>
