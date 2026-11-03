<script setup lang="ts">
import { ref } from 'vue'
import Button from '../button/Button.vue'
import Drawer from './Drawer.vue'

const handled = ref(false)
</script>

<template>
  <Button @click="handled = !handled">
    {{ handled ? 'Use a regular trigger' : 'Use a following handle' }}
  </Button>
  <Drawer
    title="Document details"
    description="A side panel using the same modal behavior as Dialog."
    trigger-label="View details"
    close-label="Close details"
  >
    <template
      v-if="handled"
      #handle="{ open }"
    >
      <span aria-hidden="true">{{ open ? 'Close' : 'Details' }}</span>
    </template>
    <p>Metadata and document actions stay in the caller.</p>
    <template #footer="{ close }">
      <Button @click="close"> Done </Button>
    </template>
  </Drawer>
</template>
