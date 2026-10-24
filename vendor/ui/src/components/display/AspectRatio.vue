<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  ratio?: number
  fit?: 'cover' | 'contain'
}>(), { ratio: 16 / 9, fit: 'cover' })
defineSlots<{ default?: () => unknown }>()
const ratio = computed(() => Number.isFinite(props.ratio) && props.ratio > 0 ? props.ratio : 1)
</script>

<template>
  <div
    class="ui-aspect-ratio"
    :class="{ 'is-contain': fit === 'contain' }"
    :style="{ aspectRatio: ratio }"
  >
    <div class="ui-aspect-ratio-body">
      <slot />
    </div>
  </div>
</template>
