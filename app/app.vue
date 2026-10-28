<script setup lang="ts">
import { Paper, UiDevtools } from '@froq/ui'

const dev = import.meta.dev
</script>

<template>
  <div class="ui">
    <Paper>
      <NuxtPage />
    </Paper>
  </div>
  <!-- Outside the Paper slot: the overlay walks the component tree, and a slot
       child would put Paper's own subtree in its path. -->
  <div
    v-if="dev"
    class="ui"
  >
    <UiDevtools />
  </div>
</template>
