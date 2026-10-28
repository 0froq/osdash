<script setup lang="ts">
import { copy } from '~/copy/en'
import { relationOf, type Story } from '~/utils/story'

const props = defineProps<{ story: Story; viewer: string; skip?: string[] }>()
const focus = defineModel<number | null>('focus', { default: null })

const entries = computed(() =>
  props.story.lanes.flatMap((lane, index) =>
    lane.flatMap(item => (props.skip?.includes(item.key) ? [] : [{ item, index }])),
  ),
)
</script>

<template>
  <ul class="st-legend">
    <li
      v-for="entry in entries"
      :key="entry.item.key"
      class="st-legend-row"
      :class="{ dim: focus !== null && focus !== entry.index }"
      :style="{ '--lane': String(entry.index) }"
      @pointerenter="focus = entry.index"
      @pointerleave="focus = null"
    >
      <a
        class="st-legend-text"
        :href="entry.item.url"
        :title="entry.item.title || undefined"
        target="_blank"
        rel="noreferrer"
        @focus="focus = entry.index"
        @blur="focus = null"
      >
        <KindIcon :kind="entry.item.kind" />
        <b>#{{ entry.item.number }}</b>
        <span
          class="st-legend-state"
          :class="`s-${entry.item.state}`"
          >{{ copy.story.state[entry.item.state] }}</span
        >
        <span class="st-legend-rel">{{ relationOf(entry.item, story, viewer) }}</span>
      </a>
    </li>
  </ul>
</template>

<style scoped>
.st-legend {
  margin: 0 0 18px;
  padding: 0;
  list-style: none;
}

.st-legend-row {
  min-height: 24px;
  padding-left: calc(var(--lane) * var(--st-col));
  transition: opacity 220ms var(--ease);
}

.st-legend-row.dim {
  opacity: 0.35;
}

.st-legend-text {
  display: flex;
  flex-wrap: wrap;
  gap: 0 8px;
  align-items: baseline;
  min-width: 0;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 18px;
  text-decoration: none;
  transition: color 160ms var(--ease);
}

.st-legend-text:hover,
.st-legend-text:focus-visible {
  color: var(--fg);
}

.st-legend-text b {
  color: var(--fg);
  font-family: var(--font-meta);
  font-size: 12px;
  font-weight: 500;
}

.st-legend-kind,
.st-legend-state {
  font-family: var(--font-meta);
  font-size: 10.5px;
  letter-spacing: 0.03em;
}

.st-legend-state.s-open {
  color: var(--fg);
}

.st-legend-state.s-merged {
  color: var(--good);
}
</style>
