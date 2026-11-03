<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    shape?: 'block' | 'text' | 'circle'
    animation?: 'pulse' | false
    width?: string | number
    height?: string | number
  }>(),
  {
    loading: true,
    shape: 'block',
    animation: 'pulse',
  },
)
const slots = useSlots()
const length = (value?: string | number) => (typeof value === 'number' ? `${value}px` : value)
const dimensions = computed(() => ({ width: length(props.width), height: length(props.height) }))
</script>

<template>
  <div
    class="ui-skeleton"
    :class="[
      `is-${shape}`,
      {
        'is-loading': loading,
        'has-content': Boolean(slots.default),
        'is-animated': animation === 'pulse',
      },
    ]"
    :style="dimensions"
    :aria-busy="loading"
  >
    <div
      v-if="slots.default"
      class="ui-skeleton-content"
      :inert="loading ? true : undefined"
      :aria-hidden="loading ? true : undefined"
    >
      <slot />
    </div>
    <div
      v-if="loading"
      class="ui-skeleton-surface"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.ui-skeleton {
  position: relative;
  min-width: 0;
}

.ui-skeleton:not(.has-content) {
  min-height: 1lh;
}

.ui-skeleton-content {
  display: flow-root;
  min-width: 0;
}

.ui-skeleton.is-loading > .ui-skeleton-content {
  visibility: hidden;
}

.ui-skeleton-surface {
  position: absolute;
  inset: 0;
  border-radius: var(--ui-radius);
  background: color-mix(in srgb, var(--ui-fg) 7%, transparent);
  pointer-events: none;
}

.ui-skeleton.is-text > .ui-skeleton-surface {
  inset-block: 20%;
}

.ui-skeleton.is-circle > .ui-skeleton-surface {
  border-radius: 50%;
}

.ui-skeleton.is-animated > .ui-skeleton-surface {
  animation: ui-skeleton-pulse 1.6s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .ui-skeleton-surface {
    animation: none !important;
  }
}

@keyframes ui-skeleton-pulse {
  50% {
    opacity: 0.5;
  }
}
</style>
