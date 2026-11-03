<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    value?: number
    max?: number
  }>(),
  { max: 100 },
)
const maximum = computed(() => (Number.isFinite(props.max) && props.max > 0 ? props.max : 100))
const current = computed(() =>
  props.value === undefined || !Number.isFinite(props.value)
    ? undefined
    : Math.min(maximum.value, Math.max(0, props.value)),
)
</script>

<template>
  <progress
    class="ui-progress"
    :aria-label="label"
    :value="current"
    :max="maximum"
  />
</template>

<style scoped>
.ui-progress {
  display: block;
  width: 100%;
  height: 4px;
  overflow: hidden;
  border: 0;
  border-radius: var(--ui-radius);
  appearance: none;
  background: var(--ui-line);
  color: var(--ui-accent);
  accent-color: var(--ui-accent);
}

.ui-progress::-webkit-progress-bar {
  background: var(--ui-line);
}

.ui-progress::-webkit-progress-value {
  background: var(--ui-accent);
}

.ui-progress::-moz-progress-bar {
  background: var(--ui-accent);
}

.ui-progress:indeterminate {
  background: linear-gradient(90deg, var(--ui-line) 25%, var(--ui-accent) 50%, var(--ui-line) 75%);
  background-size: 200% 100%;
  animation: ui-progress-pulse 1.8s linear infinite;
}

.ui-progress:indeterminate::-webkit-progress-bar {
  background: transparent;
}

.ui-progress:indeterminate::-moz-progress-bar {
  background: transparent;
}

@media (prefers-reduced-motion: reduce) {
  .ui-progress:indeterminate {
    animation: none;
  }
}

@keyframes ui-progress-pulse {
  to {
    background-position: 200% 0;
  }
}
</style>
