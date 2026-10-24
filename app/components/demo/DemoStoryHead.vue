<script setup lang="ts">
import { ago, currentItem, type Story } from '~/demo/story'

const props = defineProps<{ story: Story; nowMs: number }>()

const item = computed(() => currentItem(props.story))
const status = computed(() => {
  if (props.story.turn === 'you') return 'Your turn'
  if (props.story.turn === 'them') return 'Waiting'
  return 'Done'
})
</script>

<template>
  <header
    class="x-head"
    :class="`turn-${story.turn}`"
  >
    <p class="x-kicker">
      {{ story.repo }} · {{ item.kind === 'pr' ? 'PR' : 'Issue' }} #{{ item.number }}
    </p>
    <h3 class="x-title">{{ item.title }}</h3>
    <p class="x-status">
      <span class="x-mark" />
      <span class="x-status-word">{{ status }}</span>
      <span class="x-status-line">{{ story.now }}</span>
      <span class="x-ago">{{ ago(story.nowAt, nowMs) }}</span>
    </p>
  </header>
</template>
