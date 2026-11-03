<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ title: string; description?: string }>()
defineSlots<{ default?: () => unknown; actions?: () => unknown }>()
const id = useId()
</script>

<template>
  <section
    class="ui-empty-state"
    :aria-labelledby="id"
  >
    <h2
      :id="id"
      class="ui-empty-state-title"
    >
      {{ title }}
    </h2>
    <p
      v-if="description"
      class="ui-empty-state-description"
    >
      {{ description }}
    </p>
    <slot />
    <div
      v-if="$slots.actions"
      class="ui-empty-state-actions"
    >
      <slot name="actions" />
    </div>
  </section>
</template>

<style scoped>
.ui-empty-state {
  padding: 32px 24px;
  border: 1px dashed var(--ui-line);
  border-radius: var(--ui-radius);
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
}

.ui-empty-state-title {
  margin: 0;
  font-family: var(--ui-font-display);
  font-size: 28px;
  font-weight: normal;
  line-height: 1.2;
}

.ui-empty-state-description {
  margin: 12px 0 0;
  color: var(--ui-muted);
  font-size: 14px;
  line-height: 1.5;
}

.ui-empty-state-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-block-start: 20px;
}
</style>
