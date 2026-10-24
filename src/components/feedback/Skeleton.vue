<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = withDefaults(defineProps<{
  loading?: boolean
  shape?: 'block' | 'text' | 'circle'
  animation?: 'pulse' | false
  width?: string | number
  height?: string | number
}>(), {
  loading: true,
  shape: 'block',
  animation: 'pulse',
})
const slots = useSlots()
const length = (value?: string | number) => typeof value === 'number' ? `${value}px` : value
const dimensions = computed(() => ({ width: length(props.width), height: length(props.height) }))
</script>

<template>
  <div
    class="ui-skeleton"
    :class="[`is-${shape}`, { 'is-loading': loading, 'has-content': Boolean(slots.default), 'is-animated': animation === 'pulse' }]"
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
