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

<style scoped>
.card-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11.5px;
  line-height: 1.4;
}

.card-meta-repo {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-number {
  flex: 0 0 auto;
  white-space: nowrap;
}

.card-meta-time {
  flex: 0 0 auto;
  margin-left: auto;
  white-space: nowrap;
}
</style>
