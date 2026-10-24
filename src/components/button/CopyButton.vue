<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { useClipboard } from '../../vue'
import Button from './Button.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  text: string
  label: string
  copiedLabel: string
  errorLabel: string
  pendingLabel?: string
  resetAfter?: number
  disabled?: boolean
}>(), {
  resetAfter: 1600,
  disabled: false,
})
const emit = defineEmits<{
  copy: [text: string]
  error: [error: Error]
}>()
const attrs = useAttrs()
const { status, copy } = useClipboard(() => props.text, () => props.resetAfter)
const labels = computed(() => ({
  idle: props.label,
  pending: props.pendingLabel ?? props.label,
  copied: props.copiedLabel,
  error: props.errorLabel,
}))

async function activate(): Promise<void> {
  if (props.disabled)
    return
  const result = await copy()
  if (result?.ok)
    emit('copy', result.text)
  else if (result)
    emit('error', result.error)
}
</script>

<template>
  <Button
    v-bind="attrs"
    type="button"
    class="ui-copy-button"
    :disabled="disabled || status === 'pending'"
    :aria-busy="status === 'pending'"
    :aria-label="labels[status]"
    @click="activate"
  >
    <span
      class="ui-copy-labels"
      aria-hidden="true"
    >
      <span
        v-for="(textLabel, state) in labels"
        :key="state"
        class="ui-copy-label"
        :class="{ 'is-visible': state === status }"
      >{{ textLabel }}</span>
    </span>
    <span
      class="ui-copy-status"
      role="status"
      aria-atomic="true"
    >{{ status === 'copied' || status === 'error' ? labels[status] : '' }}</span>
  </Button>
</template>
