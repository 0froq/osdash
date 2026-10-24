<script setup lang="ts">
import { greetingCount, greetingTitle, statsLine } from '~/utils/greeting'

const props = defineProps<{
  name: string
  mine: number
  merged: number
  open: number
  averageFirstReplyMs: number | null
}>()

const parts = computed(() => {
  const text = `${greetingCount(props.mine)} · ${statsLine(props.merged, props.open, props.averageFirstReplyMs)}`
  return text
    .split(/(\d+(?:\.\d+)?)/)
    .filter(Boolean)
    .map(value => ({ value, num: /^\d/.test(value) }))
})
</script>

<template>
  <header class="greeting">
    <h1>{{ greetingTitle(name) }}</h1>
    <p class="greeting-stats"
      ><template
        v-for="(part, index) in parts"
        :key="index"
        ><span
          v-if="part.num"
          class="num"
          >{{ part.value }}</span
        ><template v-else>{{ part.value }}</template></template
      ></p
    >
  </header>
</template>
