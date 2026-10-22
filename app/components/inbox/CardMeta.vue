<script setup lang="ts">
defineProps<{
  repo: string
  number: number | null
  time: string
  unread: boolean
  tone?: 'none' | 'yellow' | 'red'
}>()
</script>

<template>
  <p class="card-meta">
    <span class="card-meta-repo">
      {{ repo }}<template v-if="number !== null">#{{ number }}</template>
    </span>
    <span
      v-if="unread"
      class="unread-dot"
    />
    <span
      class="card-meta-time"
      :class="tone && tone !== 'none' ? tone : undefined"
      >{{ time }}</span
    >
  </p>
</template>
