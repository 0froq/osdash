<script setup lang="ts">
import { copy } from '~/copy/en'

defineProps<{
  repo: string
  number: number
  issue?: boolean
  time: string
  unread: boolean
}>()
</script>

<template>
  <p class="card-meta">
    <UnreadDot v-if="unread" />
    <span class="card-meta-repo">{{ repo }}</span>
    <span class="card-number">
      <template v-if="issue">{{ copy.issuePrefix }} </template>#{{ number }}
    </span>
    <span class="card-meta-time">{{ time }}</span>
  </p>
</template>
