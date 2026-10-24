<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  value?: number
  max?: number
}>(), { max: 100 })
const maximum = computed(() => Number.isFinite(props.max) && props.max > 0 ? props.max : 100)
const current = computed(() => props.value === undefined || !Number.isFinite(props.value)
  ? undefined
  : Math.min(maximum.value, Math.max(0, props.value)))
</script>

<template>
  <progress
    class="ui-progress"
    :aria-label="label"
    :value="current"
    :max="maximum"
  />
</template>
