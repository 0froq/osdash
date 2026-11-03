<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from 'vue'
import Button from '../button/Button.vue'
import Alert from './Alert.vue'

const visible = ref(true)
const restore = useTemplateRef<InstanceType<typeof Button>>('restore')
async function dismiss() {
  visible.value = false
  await nextTick()
  restore.value?.$el.focus()
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
  <Button
    v-else
    ref="restore"
    @click="visible = true"
  >
    Show notification
  </Button>
</template>
