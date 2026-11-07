<script setup lang="ts">
import { greetingFacts, greetingTitle } from '~/utils/greeting'

const { t } = useI18n()

const props = defineProps<{
  name: string
  mine: number
  merged: number
  open: number
  averageFirstReplyMs: number | null
}>()

const facts = computed(() =>
  greetingFacts(t, props.mine, props.merged, props.open, props.averageFirstReplyMs),
)
</script>

<template>
  <header class="greeting">
    <h1>{{ greetingTitle(t, name) }}</h1>
    <p class="greeting-stats">
      <template
        v-for="(fact, index) in facts"
        :key="fact.label"
      >
        <span
          v-if="index"
          class="sep"
          aria-hidden="true"
          >·</span
        >
        <span class="fact"
          ><span class="num">{{ fact.figure }}</span> {{ fact.label }}</span
        >
      </template>
    </p>
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
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  margin-top: 10px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.45;
}

.fact {
  white-space: nowrap;
}

.sep {
  padding: 0 0.45em;
  color: var(--faint);
}

.greeting-stats .num {
  color: var(--fg);
  font-family: var(--font-meta);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 760px) {
  .greeting h1 {
    font-size: 28px;
  }
}
</style>
