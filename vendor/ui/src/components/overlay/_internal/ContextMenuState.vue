<script setup lang="ts">
import { useContextMenuControl } from '../../../vue'

const props = defineProps<{ disabled: boolean }>()
defineSlots<{ default: (scope: { prepare: (event: Event) => void }) => unknown }>()
const { close, prepare } = useContextMenuControl(() => props.disabled)
defineExpose({ close })
</script>

<template>
  <slot :prepare="prepare" />
</template>
