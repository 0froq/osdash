<script setup lang="ts">
import { ref } from 'vue'
import Button from '../button/Button.vue'
import Popover from './Popover.vue'

const reference = ref<InstanceType<typeof Button>>()
const infoOpen = ref(false)
</script>

<template>
  <Popover
    label="Publication status"
    close-label="Close status"
  >
    <template #trigger>
      <Button>Publication status</Button>
    </template>
    <template #default="{ close }">
      <p>This document is still a draft.</p>
      <Button @click="close"> Understood </Button>
    </template>
  </Popover>
  <Button
    ref="reference"
    @click="infoOpen = true"
  >
    Inspect an external anchor
  </Button>
  <Popover
    v-model="infoOpen"
    :reference="reference?.$el"
    label="External anchor"
    close-label="Close anchor information"
  >
    <p>The caller owns this target and opens the panel through v-model.</p>
  </Popover>
</template>
