<script setup lang="ts">
import Button from '../button/Button.vue'
import Drawer from './Drawer.vue'
</script>

<template>
  <Drawer
    title="Document details"
    description="A side panel using the same modal behavior as Dialog."
    trigger-label="View details"
    close-label="Close details"
  >
    <p>Metadata and document actions stay in the caller.</p>
    <template #footer="{ close }">
      <Button @click="close">
        Done
      </Button>
    </template>
  </Drawer>
</template>
