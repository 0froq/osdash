<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from 'vue'
import Alert from './Alert.vue'

const visible = ref(true)
const restore = useTemplateRef<HTMLButtonElement>('restore')
async function dismiss() {
  visible.value = false
  await nextTick()
  restore.value?.focus()
}
</script>

<template>
  <Alert
    v-if="visible"
    title="Preview saved locally"
    dismiss-label="Dismiss notification"
    @dismiss="dismiss"
  >
    Nothing has been published. You can continue editing.
  </Alert>
  <button
    v-else
    ref="restore"
    class="ui-button"
    type="button"
    @click="visible = true"
  >
    Show notification
  </button>
</template>
