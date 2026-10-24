<script setup lang="ts">
import { ref } from 'vue'
import AlertDialog from './AlertDialog.vue'

const message = ref('No action taken')
</script>

<template>
  <div>
    <AlertDialog
      title="Archive this draft?"
      description="The draft will be moved out of the active list."
      trigger-label="Archive draft"
      cancel-label="Keep draft"
      confirm-label="Archive"
      @confirm="message = 'Archive confirmed in this demo'"
    />
    <p aria-live="polite">
      {{ message }}
    </p>
  </div>
</template>
