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

<style scoped>
.greeting h1 {
  overflow: hidden;
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.greeting-stats {
  margin-top: 8px;
  color: var(--muted);
  font-size: 13px;
}

.greeting-stats .num {
  font-family: var(--font-meta);
}

@media (max-width: 760px) {
  .greeting h1 {
    font-size: 28px;
  }
}
</style>
