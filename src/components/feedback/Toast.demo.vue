<script setup lang="ts">
import { ref } from 'vue'
import Button from '../button/Button.vue'
import Toast from './Toast.vue'
import ToastRegion from './ToastRegion.vue'

const open = ref(false)
</script>

<template>
  <ToastRegion
    label="Notification"
    viewport-label="Notifications ({hotkey})"
  >
    <Button @click="open = true">
      Show notification
    </Button>
    <Toast
      v-model="open"
      title="Example notification"
      description="This demonstrates a temporary message, not a completed save."
      close-label="Dismiss notification"
    />
  </ToastRegion>
</template>
