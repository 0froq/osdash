<script setup lang="ts">
import { ref } from 'vue'
import Button from '../button/Button.vue'
import Toast from './Toast.vue'
import ToastRegion from './ToastRegion.vue'

const open = ref(false)
</script>

<template>
  <ToastRegion
    label="Background notification"
    viewport-label="Background notifications"
    position="bottom-start"
    :duration="8000"
    :hotkey="[]"
  >
    <Button @click="open = true">
      Show background notification
    </Button>
    <Toast
      v-model="open"
      title="Library demo"
      description="Pause the countdown by hovering or focusing the notification area."
      close-label="Dismiss notification"
      type="background"
    />
  </ToastRegion>
</template>
