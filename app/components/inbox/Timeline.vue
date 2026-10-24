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
