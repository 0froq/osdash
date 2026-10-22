<script setup lang="ts">
import { greetingCount, greetingTitle, statsLine } from '~/utils/greeting'

defineProps<{
  name: string
  mine: number
  merged: number
  open: number
  averageFirstReplyMs: number | null
}>()
</script>

<template>
  <header class="greeting">
    <h1>{{ greetingTitle(name) }}</h1>
    <p class="greeting-count">{{ greetingCount(mine) }}</p>
    <p class="greeting-stats">{{ statsLine(merged, open, averageFirstReplyMs) }}</p>
  </header>
</template>
