<script setup lang="ts">
import type { TimelineEntry } from '#shared/events'
import type { StoryItem } from '#shared/story'
import type { UnitView } from '#shared/unit'
import { copy } from '~/copy/en'
import { reasonText } from '~/utils/reason'
import {
  buildStory,
  relationOf,
  storyGrid,
  storyRows,
  type StoryLine,
  type StoryRow,
} from '~/utils/story'
import { waitingAge } from '~/utils/time'

const props = defineProps<{
  entries: TimelineEntry[]
  items: StoryItem[]
  unit: UnitView
  viewer: string
  truncated: boolean
  originalUrl: string
}>()

const nowMs = Date.now()
const open = ref(new Set<string>())
const focus = ref<number | null>(null)

const story = computed(() =>
  buildStory(
    props.entries,
    props.items,
    {
      kind: props.unit.kind,
      category: props.unit.category,
      ended: props.unit.ended,
      myTurn: props.unit.myTurn,
      reasonCode: props.unit.reasonCode,
      reasonActor: props.unit.reasonActor,
      links: { comment: props.unit.links.comment },
    },
    props.viewer,
  ),
)

const spine = computed(() => (story.value?.rails.length ?? 0) <= 1)
const rows = computed(() => (story.value ? storyRows(story.value, open.value) : []))
const grid = computed(() =>
  story.value ? storyGrid(story.value, rows.value, props.viewer, spine.value) : [],
)

const foldIds = computed(() =>
  (story.value?.blocks ?? []).flatMap(block => (block.type === 'fold' ? [block.fold.id] : [])),
)
const allOpen = computed(
  () => foldIds.value.length > 0 && foldIds.value.every(id => open.value.has(id)),
)

function toggle(id: string): void {
  const next = new Set(open.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  open.value = next
}

function toggleAll(): void {
  open.value = allOpen.value ? new Set() : new Set(foldIds.value)
}

const nowText = computed(() =>
  props.unit.reasonCode === 'clef' && props.unit.quote
    ? props.unit.quote
    : reasonText(props.unit.reasonCode, props.unit.reasonActor),
)
const waited = computed(() =>
  story.value?.turn === 'waiting' ? waitingAge(props.unit.ageMs) : null,
)

function laneOf(key: string): number {
  return story.value?.lanes.findIndex(lane => lane.some(item => item.key === key)) ?? -1
}

function elsewhere(line: StoryLine): number | null {
  const current = story.value
  if (!current || line.item === current.primary.key || line.start || line.end) return null
  return current.items.find(item => item.key === line.item)?.number ?? null
}

function rowClass(row: StoryRow) {
  const dim =
    focus.value !== null &&
    (row.type === 'line' ? laneOf(row.line.item) !== focus.value : row.type !== 'fold')
  if (row.type === 'line') {
    return [
      'row-line',
      {
        'minor': row.minor,
        'in-fold': row.fold !== null,
        'fold-first': row.first,
        'fold-last': row.last,
        dim,
      },
    ]
  }
  if (row.type === 'fold') return ['row-fold', { open: row.open, dim }]
  return [`row-${row.type}`, { dim }]
}

function stagger(row: StoryRow, index: number): string {
  if (row.type === 'line' && row.fold !== null) {
    const fold = story.value?.blocks.find(
      block => block.type === 'fold' && block.fold.id === row.fold,
    )
    const position =
      fold?.type === 'fold' ? fold.fold.lines.findIndex(line => line.id === row.id) : 0
    return String(Math.min(position, 12))
  }
  return String(Math.min(index, 14))
}
</script>

<template>
  <div
    v-if="story"
    class="st"
    :class="[`turn-${story.turn}`, spine ? 'is-spine' : 'is-graph']"
    :style="{ '--st-lanes': String(spine ? 1 : story.lanes.length) }"
  >
    <p
      v-if="truncated"
      class="st-truncated"
    >
      {{ copy.preview.truncated }}
      ·
      <a
        class="card-link"
        :href="originalUrl"
        target="_blank"
        rel="noreferrer"
        >{{ copy.preview.source }}</a
      >
    </p>

    <TimelineLegend
      v-if="!spine"
      v-model:focus="focus"
      :story="story"
      :viewer="viewer"
    />
    <div
      v-if="story.related.length"
      class="st-related"
    >
      <span class="st-related-label">{{ copy.story.related }}</span>
      <ul>
        <li
          v-for="item in story.related"
          :key="item.key"
        >
          <a
            :href="item.url"
            target="_blank"
            rel="noreferrer"
            >#{{ item.number }}</a
          >
          <span>{{ copy.story.kind[item.kind] }} {{ copy.story.state[item.state] }}</span>
          <span class="st-related-rel">{{ relationOf(item, story, viewer) }}</span>
        </li>
      </ul>
    </div>

    <div
      v-if="foldIds.length"
      class="st-tools"
    >
      <button
        type="button"
        :aria-pressed="allOpen"
        @click="toggleAll"
      >
        {{ allOpen ? copy.story.collapseAll : copy.story.expandAll }}
      </button>
    </div>

    <TransitionGroup
      tag="ol"
      class="st-list"
      name="st-row"
      appear
    >
      <li
        v-for="(row, r) in rows"
        :key="row.id"
        class="st-row"
        :class="rowClass(row)"
        :style="{ '--i': stagger(row, r) }"
      >
        <button
          v-if="row.type === 'fold'"
          type="button"
          class="st-row-in st-fold"
          :aria-expanded="row.open"
          :aria-label="copy.story.foldLabel(row.fold.lines.length, row.open)"
          @click="toggle(row.id)"
        >
          <TimelineGutter
            :cells="grid[r] ?? []"
            :focus="focus"
          />
          <span class="st-body st-fold-text">
            <span class="st-fold-count">{{ copy.story.events(row.fold.lines.length) }}</span>
            <span class="st-fold-sum">{{ row.fold.summary }}</span>
          </span>
        </button>
        <div
          v-else
          class="st-row-in"
        >
          <TimelineGutter
            :cells="grid[r] ?? []"
            :focus="focus"
          />
          <div class="st-body">
            <TimelineLine
              v-if="row.type === 'line'"
              :line="row.line"
              :minor="row.minor"
              :now-ms="nowMs"
              :elsewhere="elsewhere(row.line)"
            />
            <p
              v-else-if="row.type === 'now'"
              class="st-now"
            >
              <span class="st-now-label">{{ copy.story.now }}</span>
              <span class="st-now-text">{{ nowText }}</span>
              <span
                v-if="waited"
                class="st-now-wait"
                >{{ waited }}</span
              >
            </p>
            <p
              v-else
              class="st-next"
            >
              <b>{{ row.next.who }}</b>
              <span>{{ row.next.text }}</span>
            </p>
          </div>
        </div>
      </li>
    </TransitionGroup>
  </div>
</template>

<style>
/* The fold button lives in this component and the stack dots live in
   TimelineGutter, so the hover has to cross a scope boundary. */
.st-fold:hover .n-stack b:nth-child(1),
.st-fold:focus-visible .n-stack b:nth-child(1) {
  top: 8%;
}

.st-fold:hover .n-stack b:nth-child(3),
.st-fold:focus-visible .n-stack b:nth-child(3) {
  top: 92%;
}
</style>

<style scoped>
/*
 * Contribution story. One rail per issue or PR. A PR branches from the issues
 * it closes and joins them when it merges. Folds hide the lines between key
 * lines and never change the rails. Every row puts its node at --st-y, so the
 * rail segments meet at the node whatever the row height.
 */
.st {
  --st-col: 14px;
  --st-y: 14px;
  --st-w: 1.5px;
  --st-ink: color-mix(in oklab, var(--fg) 72%, transparent);
  --st-ink-other: color-mix(in oklab, var(--fg) 26%, transparent);
  --st-good: var(--good);
  --st-bad: light-dark(#b2412f, #ef7a66);
  --st-soft: color-mix(in oklab, var(--fg) 4.5%, transparent);
  --st-bracket: color-mix(in oklab, var(--fg) 16%, transparent);
  margin-top: 26px;
}

.st-truncated,
.st-related {
  display: flex;
  gap: 10px;
  align-items: baseline;
  margin: 0 0 14px;
  color: var(--muted);
  font-size: 12px;
}

.st-related-label {
  flex: none;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.st-related ul {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.st-related li {
  display: inline-flex;
  gap: 6px;
  align-items: baseline;
}

.st-related a {
  color: var(--fg);
  font-variant-numeric: tabular-nums;
  text-decoration: none;
}

.st-related a:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.st-related-rel::before {
  content: '·';
  margin-right: 6px;
}

/* Legend */
.st-tools {
  display: flex;
  justify-content: flex-end;
  margin: 0 0 4px;
}

.st-tools button {
  padding: 2px 0;
  border: 0;
  background: none;
  color: var(--muted);
  cursor: pointer;
  font-family: var(--font-meta);
  font-size: 11px;
  letter-spacing: 0.02em;
  transition: color 160ms var(--ease);
}

.st-tools button:hover,
.st-tools button:focus-visible {
  color: var(--fg);
}

/* Rows */
.st-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.st-row {
  display: grid;
  grid-template-rows: 1fr;
  transition: opacity 220ms var(--ease);
}

.st-row-in {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 12px;
  min-height: 0;
}

.st-body {
  min-width: 0;
  padding: 4px 0 14px;
  transition: opacity 220ms var(--ease);
}

.st-row.dim .st-body {
  opacity: 0.4;
}

.st-row.minor,
.st-row.row-next {
  --st-y: 11px;
}

.st-row.minor .st-body,
.st-row.row-next .st-body {
  padding: 2px 0 6px;
}

.st-row.row-fold {
  --st-y: 12px;
}

.st-row.row-now {
  --st-y: 19px;
}

.st-row.row-now .st-body {
  padding: 8px 0 18px;
}

/* Gutter */
/* Text */
/* Open folds indent their lines inside a bracket that starts at the fold row. */
.row-line.in-fold .st-body,
.row-fold.open .st-fold-text {
  position: relative;
}

.row-line.in-fold .st-body {
  padding-left: 18px;
}

.row-fold.open .st-fold-text::before,
.row-line.in-fold .st-body::before {
  content: '';
  position: absolute;
  left: 3px;
  width: 7px;
  border-left: 1px solid var(--st-bracket);
}

.row-fold.open .st-fold-text::before {
  top: var(--st-y);
  bottom: 0;
  border-top: 1px solid var(--st-bracket);
  border-top-left-radius: 6px;
}

.row-line.in-fold .st-body::before {
  top: 0;
  bottom: 0;
}

.row-line.fold-last .st-body::before {
  bottom: auto;
  height: var(--st-y);
  border-bottom: 1px solid var(--st-bracket);
  border-bottom-left-radius: 6px;
}

.row-line.fold-last .st-body {
  padding-bottom: 12px;
}

/* Fold rows */
.st-fold {
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.st-fold-text {
  display: flex;
  flex-wrap: wrap;
  gap: 0 8px;
  align-items: baseline;
  padding: 3px 0 10px;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 18px;
  transition: color 160ms var(--ease);
}

.row-fold.open .st-fold-text {
  padding-left: 18px;
}

.st-fold-count {
  color: var(--fg);
  font-family: var(--font-meta);
  font-size: 11px;
  opacity: 0.7;
}

.st-fold:hover .st-fold-text,
.st-fold:focus-visible .st-fold-text {
  color: var(--fg);
}

.st-fold:focus-visible {
  outline: none;
}

.st-fold:focus-visible .st-fold-sum {
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* Now and next */
.st-now {
  display: flex;
  flex-wrap: wrap;
  gap: 0 8px;
  align-items: baseline;
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
}

.st-now-label {
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 10.5px;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.turn-you .st-now-label {
  color: var(--accent);
}

.st-now-wait {
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11px;
  font-weight: 400;
}

.st-next {
  display: flex;
  flex-wrap: wrap;
  gap: 0 6px;
  color: var(--muted);
  font-size: 13px;
  line-height: 18px;
}

.st-next b {
  color: var(--fg);
  font-weight: 500;
}

/* Motion. Rows unroll by height so rails draw down as they arrive. */
.st-row-enter-active,
.st-row-leave-active {
  transition:
    grid-template-rows 380ms var(--ease),
    opacity 300ms var(--ease);
}

.st-row-enter-active {
  transition-delay: calc(var(--i) * 26ms);
}

.st-row-leave-active {
  transition-duration: 240ms, 160ms;
}

.st-row-enter-from,
.st-row-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

.st-row-enter-active .st-row-in,
.st-row-leave-active .st-row-in {
  overflow: hidden;
}

.st-row-enter-active .st-body {
  transition: transform 420ms var(--ease);
  transition-delay: calc(var(--i) * 26ms);
}

.st-row-enter-from .st-body {
  transform: translateY(-5px);
}

.st-row-enter-active :deep(.st-node) {
  animation: st-pop 460ms var(--ease) both;
  animation-delay: calc(var(--i) * 26ms + 120ms);
}

@keyframes st-pop {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }

  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

@keyframes st-pulse {
  0% {
    opacity: 0.55;
    transform: scale(1);
  }

  70%,
  100% {
    opacity: 0;
    transform: scale(2.2);
  }
}

@media (max-width: 760px) {
  .st {
    --st-col: 12px;
  }
}
.card-link {
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 12px;
  transition: color var(--dur-1) var(--ease);
}

.card-link:hover {
  color: var(--fg);
}
</style>
