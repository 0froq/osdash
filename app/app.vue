<script setup lang="ts">
import { Paper, UiDevtools } from '@froq/ui'

const dev = import.meta.dev
</script>

<template>
  <div class="ui">
    <Paper>
      <NuxtPage />
    </Paper>
    <UiDevtools v-if="dev" />
  </div>
</template>
