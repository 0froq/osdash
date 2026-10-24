<script setup lang="ts">
import type { StoryCell } from '~/utils/story'
import { copy } from '~/copy/en'
import { relationOf, type Story } from '~/utils/story'

const props = defineProps<{ story: Story; viewer: string }>()
const focus = defineModel<number | null>('focus', { default: null })

const entries = computed(() =>
  props.story.lanes.flatMap((lane, index) => lane.map(item => ({ item, index }))),
)

/** The legend is a gutter with a single node: the lane this entry sits on. */
function cellsOf(entry: (typeof entries.value)[number]): StoryCell[] {
  return props.story.lanes.map((_, lane) => ({
    lane,
    up: false,
    down: false,
    node: lane === entry.index ? entry.item.state : null,
    hl: false,
    hr: false,
    cross: false,
    link: null,
    dashed: false,
    mine: entry.item.authorLogin.toLowerCase() === props.viewer.toLowerCase(),
    primary: entry.item.role === 'primary',
    fade: false,
  }))
}
</script>

<template>
  <ul class="st-legend">
    <li
      v-for="entry in entries"
      :key="entry.item.key"
      class="st-legend-row"
      :class="{ dim: focus !== null && focus !== entry.index }"
      @pointerenter="focus = entry.index"
      @pointerleave="focus = null"
    >
      <TimelineGutter
        :cells="cellsOf(entry)"
        :focus="focus"
      />
      <a
        class="st-legend-text"
        :href="entry.item.url"
        :title="entry.item.title || undefined"
        target="_blank"
        rel="noreferrer"
        @focus="focus = entry.index"
        @blur="focus = null"
      >
        <b>#{{ entry.item.number }}</b>
        <span class="st-legend-kind">{{ copy.story.kind[entry.item.kind] }}</span>
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
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 12px;
  align-items: center;
  min-height: 24px;
  transition: opacity 220ms var(--ease);
}

.st-legend-row.dim {
  opacity: 0.35;
}

/* The gutter is its own component, so the row reaches in through the scope. */
.st-legend-row :deep(.st-gutter) {
  align-self: stretch;
}

.st-legend-row :deep(.st-node) {
  top: 50%;
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
