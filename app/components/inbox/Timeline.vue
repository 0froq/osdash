<script setup lang="ts">
import type { TimelineEntry } from '#shared/events'
import type { StoryItem } from '#shared/story'
import type { UnitNote, UnitView } from '#shared/unit'
import { copy } from '~/copy/en'
import { reasonText } from '~/utils/reason'
import {
  buildStory,
  railStrokes,
  relationOf,
  rowNodeY,
  storyGrid,
  storyRows,
  type StoryCell,
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
  notes: UnitNote[]
  notesEditable?: boolean
  editableNoteIds?: string[]
  /** The card crops older history while keeping the current state visible. */
  compact?: boolean
}>()

const emit = defineEmits<{
  noteSave: [payload: { id: string; text: string; version: string | null }]
  noteMove: [payload: { id: string; anchor: string }]
  noteDelete: [id: string]
  noteCancel: [id: string]
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
// Draw recorded activity through Now, without projecting future closure.
const rows = computed<StoryRow[]>(() =>
  story.value ? storyRows(story.value, open.value).filter(row => row.type !== 'future') : [],
)
const grid = computed(() =>
  story.value ? storyGrid(story.value, rows.value, props.viewer, spine.value) : [],
)

const visibleRows = computed(() => rows.value.map((row, index) => ({ row, index })))
const futureY = computed(() => (story.value?.tail.converge.length ? '24px' : '16px'))
const strokes = computed(() => railStrokes(rows.value, grid.value, futureY.value))
const group = ref<HTMLOListElement | null>(null)
const boxes = ref(new Map<string, { top: number; height: number }>())
const continuing = computed(
  () =>
    story.value?.primary.state === 'open' &&
    (story.value.primary.kind === 'pr' ||
      (props.unit.kind === 'issue-only' && props.unit.labels.includes('Self-claimed'))),
)
const continuations = computed(() => {
  if (!continuing.value || !story.value) return []
  const now = rows.value.find(row => row.type === 'now')
  const box = now && boxes.value.get(now.id)
  if (!now || !box) return []
  const top = `${box.top + Number.parseFloat(rowNodeY(now))}px`
  const keys = spine.value ? [story.value.primary.key] : story.value.tail.open
  const lanes = new Set<number>()
  for (const key of keys) {
    const lane = spine.value ? 0 : laneOf(key)
    if (lane >= 0) lanes.add(lane)
  }
  return [...lanes].flatMap(lane => {
    const stroke = strokes.value.findLast(entry => entry.lane === lane)
    return stroke ? [{ lane, mine: stroke.mine, top }] : []
  })
})

function rowBox(index: number) {
  const row = rows.value[index]
  return row ? boxes.value.get(row.id) : undefined
}

function measureRails() {
  const el = group.value
  if (!el) return
  const next = new Map<string, { top: number; height: number }>()
  for (const row of el.querySelectorAll<HTMLElement>(':scope > .st-row')) {
    const id = row.dataset.rowId
    if (!id) continue
    next.set(id, { top: row.offsetTop, height: row.offsetHeight })
  }
  boxes.value = next
}

const placed = computed(() =>
  strokes.value.flatMap(stroke => {
    const start = rowBox(stroke.row - 1)
    if (!start) return []
    const y0 = Number.parseFloat(stroke.y0)
    const y1 = Number.parseFloat(stroke.y1)
    const top = start.top + y0
    const endRow = stroke.end === 'extend' ? rowBox(stroke.row - 1 + stroke.span) : undefined
    const last = stroke.end === 'bottom' ? rowBox(stroke.row - 1 + stroke.span - 1) : undefined
    let bottom: number | undefined
    if (stroke.end === 'same') bottom = start.top + y1
    else if (stroke.end === 'extend') bottom = endRow && endRow.top + y1
    else bottom = last && last.top + last.height
    // Stop each future rail at its connector, without a spur below it.
    if (stroke.dashed) {
      for (const bridge of bridges.value) {
        if (!bridge.dashed) continue
        const box = boxes.value.get(bridge.rowId)
        if (!box) continue
        const y = box.top + Number.parseFloat(futureY.value)
        if (stroke.lane === bridge.from) bottom = y - 12
        else if (stroke.lane === bridge.to) bottom = y
      }
    }
    if (bottom === undefined || bottom <= top) return []
    return [{ ...stroke, top: `${top}px`, height: `${bottom - top}px` }]
  }),
)

const bridges = computed(() => {
  const current = story.value
  if (!current) return []
  const list: {
    key: string
    rowId: string
    from: number
    to: number
    dashed: boolean
    mine: boolean
  }[] = []
  for (const row of rows.value) {
    if (row.type !== 'line' && row.type !== 'future') continue
    const fromKey = row.type === 'line' ? row.line.item : current.primary.key
    const targets =
      row.type === 'line' ? [...row.line.fork, ...row.line.joins] : current.tail.converge
    const from = laneOf(fromKey)
    for (const target of targets) {
      const to = laneOf(target)
      if (from < 0 || to < 0 || to === from) continue
      const item = current.items.find(entry => entry.key === fromKey)
      list.push({
        key: `${row.id}:${from}:${to}`,
        rowId: row.id,
        from,
        to,
        dashed: row.type === 'future',
        mine: item ? item.authorLogin.toLowerCase() === props.viewer.toLowerCase() : true,
      })
    }
  }
  return list
})

const placedBridges = computed(() =>
  bridges.value.flatMap(bridge => {
    const box = boxes.value.get(bridge.rowId)
    const row = rows.value.find(entry => entry.id === bridge.rowId)
    if (!box || !row) return []
    return [{ ...bridge, y: `${box.top + Number.parseFloat(rowNodeY(row, futureY.value))}px` }]
  }),
)

let railObserver: ResizeObserver | undefined
onMounted(() => {
  railObserver = new ResizeObserver(() => measureRails())
  if (group.value) railObserver.observe(group.value)
  measureRails()
})
onBeforeUnmount(() => railObserver?.disconnect())
watch(rows, () => nextTick(measureRails))

/** Each story row's time, so a note can be placed by stamp instead of by id. */
function rowTime(row: StoryRow): number | null {
  if (row.type === 'line') return row.line.at
  if (row.type === 'now') return nowMs
  return null
}

/**
 * Notes are placed by time: a note sits after the last row that is not newer
 * than it. The `at` row is the anchor; notes keep their own stamp so they
 * survive rows disappearing from the data.
 */
const notesAfter = computed(() => {
  const map = new Map<string, UnitNote[]>()
  const timed = rows.value
    .map((row, index) => ({ row, index, time: rowTime(row) }))
    .filter((entry): entry is { row: StoryRow; index: number; time: number } => entry.time !== null)

  for (const note of props.notes) {
    const stamp = Date.parse(note.anchor)
    if (Number.isNaN(stamp)) continue
    // The last timed row at or before the note; falls back to the first row.
    let target = timed[0]?.row.id ?? rows.value[0]?.id
    for (const entry of timed) {
      if (entry.time <= stamp) target = entry.row.id
      else break
    }
    if (!target) continue
    const list = map.get(target) ?? []
    list.push(note)
    map.set(target, list)
  }
  for (const list of map.values()) list.sort((a, b) => Date.parse(a.anchor) - Date.parse(b.anchor))
  return map
})

/** Every row a note can be moved to, keyed by that row's time. */
const anchors = computed(() =>
  rows.value.flatMap(row => {
    const time = rowTime(row)
    if (time === null) return []
    return [
      {
        id: new Date(time).toISOString(),
        label: row.type === 'line' ? `${row.line.actor} ${row.line.verb}` : copy.story.now,
      },
    ]
  }),
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

/** Opened lines carry the lane label, so the legend only keeps rails without one. */
const openedKeys = computed(() => {
  const keys: string[] = []
  for (const block of story.value?.blocks ?? []) {
    const lines = block.type === 'line' ? [block.line] : block.fold.lines
    for (const line of lines) if (line.start) keys.push(line.item)
  }
  return keys
})
const legendLeft = computed(
  () =>
    story.value?.lanes.some(lane => lane.some(item => !openedKeys.value.includes(item.key))) ??
    false,
)

function railOf(line: StoryLine) {
  if (!line.start || !story.value) return null
  const item = story.value.items.find(entry => entry.key === line.item)
  const lane = item ? laneOf(item.key) : -1
  if (!item || lane < 0) return null
  const self = item.authorLogin.toLowerCase() === props.viewer.toLowerCase()
  return {
    kind: item.kind,
    login: item.authorLogin,
    who: self ? copy.story.you : item.authorLogin,
    number: item.number,
    url: item.url,
    title: item.title,
    lane,
  }
}

function gutterCells(row: StoryRow, index: number) {
  const cells = grid.value[index] ?? []
  if (row.type !== 'line') return cells
  const lane = laneOf(row.line.item)
  const expandable = Boolean(row.line.body)
  return cells.map(cell => {
    if (cell.lane !== lane) return cell
    if (row.line.start) return { ...cell, node: null }
    if (!expandable || (cell.node !== 'dot' && cell.node !== 'minor')) return cell
    const node: StoryCell['node'] = long.value.has(row.line.id) ? 'open' : 'dot'
    return { ...cell, node }
  })
}

/** The lane a fold belongs to, so its stack sits on that rail. */
function foldCells(row: Extract<StoryRow, { type: 'fold' }>, index: number) {
  const lane = laneOf(row.fold.lane)
  return (grid.value[index] ?? []).map(cell =>
    cell.lane === lane ? cell : { ...cell, node: null },
  )
}

const long = ref(new Set<string>())

function toggleLong(id: string): void {
  const next = new Set(long.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  long.value = next
}

function enterRow(row: StoryRow) {
  if (row.type === 'line' && row.line.start) focus.value = laneOf(row.line.item)
}

function leaveRow(row: StoryRow) {
  if (row.type === 'line' && row.line.start && focus.value === laneOf(row.line.item))
    focus.value = null
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
  return [
    `row-${row.type}`,
    { dim, converging: row.type === 'future' && Boolean(story.value?.tail.converge.length) },
  ]
}
</script>

<template>
  <div
    v-if="story"
    class="st"
    :class="[`turn-${story.turn}`, spine ? 'is-spine' : 'is-graph', { compact }]"
    :style="{ '--st-lanes': String(spine ? 1 : story.lanes.length) }"
  >
    <p
      v-if="truncated && !compact"
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
      v-if="!spine && !compact && legendLeft"
      v-model:focus="focus"
      :story="story"
      :viewer="viewer"
      :skip="openedKeys"
    />
    <div
      v-if="story.related.length && !compact"
      class="st-related"
    >
      <span class="st-related-label">{{ copy.story.related }}</span>
      <ul>
        <li
          v-for="item in story.related"
          :key="item.key"
        >
          <KindIcon :kind="item.kind" />
          <a
            :href="item.url"
            target="_blank"
            rel="noreferrer"
            >#{{ item.number }}</a
          >
          <span>{{ copy.story.state[item.state] }}</span>
          <span class="st-related-rel">{{ relationOf(item, story, viewer) }}</span>
        </li>
      </ul>
    </div>

    <div
      v-if="foldIds.length && !compact"
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

    <ol
      ref="group"
      class="st-list"
      :class="{ continuing }"
    >
      <li
        key="rails"
        class="st-rails"
        aria-hidden="true"
      >
        <i
          v-for="stroke in placed"
          :key="stroke.key"
          class="st-stroke"
          :class="{
            dashed: stroke.dashed,
            fade: stroke.fade,
            tail: stroke.tail,
            other: !stroke.mine,
            on: focus === stroke.lane,
            dim: focus !== null && focus !== stroke.lane,
          }"
          :style="{
            '--lane': String(stroke.lane),
            '--shift': stroke.shift,
            'top': stroke.top,
            'height': stroke.height,
          }"
        />
        <i
          v-for="tail in continuations"
          :key="tail.lane"
          class="st-stroke st-continuation"
          :class="{
            other: !tail.mine,
            on: focus === tail.lane,
            dim: focus !== null && focus !== tail.lane,
          }"
          :style="{ '--lane': String(tail.lane), 'top': tail.top }"
        />
        <svg
          v-for="bridge in placedBridges"
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
          :key="bridge.key"
          class="st-bridge"
          :class="{
            'to-left': bridge.from > bridge.to,
            'dashed': bridge.dashed,
            'other': !bridge.mine,
            'on': focus === bridge.from,
            // The branch belongs to the PR rail (from), not the issue it touches.
            'dim': focus !== null && focus !== bridge.from,
          }"
          :style="{
            '--from': String(Math.min(bridge.from, bridge.to)),
            '--to': String(Math.max(bridge.from, bridge.to)),
            '--y': bridge.y,
          }"
        >
          <path
            d="M 0 12 H 100"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </li>
      <TransitionGroup name="st-row">
        <li
          v-for="{ row, index: r } in visibleRows"
          :key="row.id"
          :data-row-id="row.id"
          class="st-row"
          :class="rowClass(row)"
          :style="{
            '--st-y': rowNodeY(row, futureY),
            '--i': String(row.type === 'line' && row.first ? r : 0),
          }"
          :aria-hidden="row.type === 'future' ? true : undefined"
          @pointerenter="enterRow(row)"
          @pointerleave="leaveRow(row)"
        >
          <component
            :is="compact ? 'div' : 'button'"
            v-if="row.type === 'fold'"
            :type="compact ? undefined : 'button'"
            class="st-row-in st-fold"
            :aria-expanded="compact ? undefined : row.open"
            :aria-label="
              compact ? undefined : copy.story.foldLabel(row.fold.lines.length, row.open)
            "
            @click="!compact && toggle(row.id)"
          >
            <TimelineGutter
              :cells="foldCells(row, r)"
              :focus="focus"
            />
            <span class="st-body">
              <span class="st-title">
                <span class="st-fold-count">{{ copy.story.events(row.fold.lines.length) }}</span>
                <span class="st-fold-sum">{{ row.fold.summary }}</span>
              </span>
            </span>
          </component>
          <div
            v-else
            class="st-row-in"
          >
            <TimelineGutter
              :cells="gutterCells(row, r)"
              :focus="focus"
            />
            <div
              v-if="row.type !== 'future'"
              class="st-body"
            >
              <TimelineLine
                v-if="row.type === 'line'"
                :line="row.line"
                :minor="row.minor"
                :compact="compact"
                :now-ms="nowMs"
                :elsewhere="elsewhere(row.line)"
                :rail="railOf(row.line)"
                :open="long.has(row.line.id)"
                :expandable="Boolean(row.line.body) && !compact"
                @toggle="toggleLong(row.line.id)"
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
              <NoteCard
                v-for="note in notesAfter.get(row.id) ?? []"
                :key="note.id"
                :note="note"
                :editable="notesEditable && editableNoteIds?.includes(note.id)"
                :anchors="anchors"
                @save="emit('noteSave', { id: note.id, ...$event })"
                @move="emit('noteMove', { id: note.id, anchor: $event })"
                @remove="emit('noteDelete', note.id)"
                @cancel="emit('noteCancel', note.id)"
              />
            </div>
          </div>
        </li>
      </TransitionGroup>
    </ol>
  </div>
</template>

<style scoped>
/*
 * Contribution story. One rail per issue or PR. A PR branches from the issues
 * it closes and joins them when it merges. Folds hide the lines between key
 * lines and never change the rails. Each lane is one stroke, not a stack of
 * row segments, so the line cannot step a pixel at a row boundary.
 */
.st {
  --st-col: 14px;
  --st-y: 14px;
  --st-w: 2px;
  --st-ink: color-mix(in oklab, var(--fg) 72%, transparent);
  --st-ink-other: color-mix(in oklab, var(--fg) 26%, transparent);
  --st-good: var(--good);
  --st-bad: light-dark(#b2412f, #ef7a66);
  --st-soft: color-mix(in oklab, var(--fg) 4.5%, transparent);
  --st-bracket: color-mix(in oklab, var(--fg) 16%, transparent);
  display: flex;
  flex: none;
  flex-direction: column;
  margin-top: 26px;
}

.st.compact {
  margin-top: 0;
}

.st.compact .st-row:last-child .st-body {
  padding-bottom: 0;
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
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.st-list.continuing {
  padding-bottom: 20px;
}

.st-continuation {
  height: 24px;
  mask-image: linear-gradient(to bottom, #000, transparent);
}

.st-rails {
  position: absolute;
  z-index: 0;
  top: 0;
  left: 0;
  width: calc(var(--st-lanes) * var(--st-col));
  pointer-events: none;
}

.st-stroke {
  position: absolute;
  left: calc(var(--lane) * var(--st-col) + (var(--st-col) - var(--st-w)) / 2);
  width: var(--st-w);
  background: currentColor;
  color: var(--st-ink);
  transition:
    color 220ms var(--ease),
    opacity 220ms var(--ease);
}

.st-stroke.other {
  color: var(--st-ink-other);
}

.st-stroke.on {
  color: var(--fg);
}

.st-stroke.dim {
  opacity: 0.22;
}

.st-stroke.dashed {
  background-color: transparent;
  background-image: repeating-linear-gradient(currentColor 0 3px, transparent 3px 7px);
  background-repeat: repeat-y;
  background-size: 100% 7px;
  background-position: 0 var(--shift);
}

.st-stroke.fade {
  mask-image: linear-gradient(to bottom, transparent, #000 24px);
}

.st-stroke.tail {
  mask-image: linear-gradient(to bottom, #000 55%, transparent);
}

.st-bridge {
  position: absolute;
  overflow: visible;
  left: calc(var(--from) * var(--st-col) + var(--st-col) / 2);
  width: calc((var(--to) - var(--from)) * var(--st-col));
  top: calc(var(--y) - 12px);
  height: 12px;
  color: var(--st-ink);
  transition:
    color 220ms var(--ease),
    opacity 220ms var(--ease);
}

.st-bridge path {
  fill: none;
  stroke: currentColor;
  stroke-width: 2px;
  stroke-linecap: butt;
  stroke-linejoin: miter;
}

.st-bridge.to-left {
  transform: scaleX(-1);
}

.st-bridge.other {
  color: var(--st-ink-other);
}

.st-bridge.on {
  color: var(--fg);
}

.st-bridge.dim {
  opacity: 0.22;
}

.st-bridge.dashed path {
  stroke-dasharray: 3 4;
}

.st-row:has(button.st-line-hit:hover) :deep(.st-node),
.st-row:has(button.st-line-hit:focus-visible) :deep(.st-node),
.st-row:has(.st-fold:hover) :deep(.st-node),
.st-row:has(.st-fold:focus-visible) :deep(.st-node),
.st:has(.st-legend-row:hover) .st-row:not(.dim) :deep(.n-stack),
.st:has(.st-legend-row:focus-within) .st-row:not(.dim) :deep(.n-stack) {
  color: var(--fg);
}

/* Group folds and collapsible lines share one title box: it hugs the words,
   and hover lights the node plus a wash behind those words only. */
.st-title {
  display: inline-flex;
  gap: 0 6px;
  align-items: center;
  margin: 0 -6px;
  padding: 1px 6px;
  border-radius: 8px;
  transition: background-color var(--dur-2) var(--ease);
}

.st-fold:hover .st-title,
.st-fold:focus-visible .st-title {
  background: color-mix(in oklab, var(--fg) 6%, transparent);
}

.st-row {
  position: relative;
  z-index: 1;
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  grid-template-rows: 1fr;
  transition:
    grid-template-rows var(--dur-3) var(--ease),
    opacity 220ms var(--ease);
}

.st-row-enter-active,
.st-row-leave-active {
  transition-delay: calc(min(var(--i), 8) * 24ms);
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

.st-row-enter-active .st-body,
.st-row-leave-active .st-body {
  transition:
    opacity var(--dur-3) var(--ease),
    translate var(--dur-3) var(--ease);
  transition-delay: calc(min(var(--i), 8) * 24ms);
}

.st-row-enter-from .st-body {
  opacity: 0;
  translate: 0 6px;
}

.st-row-leave-to .st-body {
  opacity: 0;
  translate: 0 -4px;
}

.st-row-in {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
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

.st-row.minor .st-body {
  padding: 2px 0 6px;
}

.st-row.row-now .st-body {
  padding: 8px 0 0;
}

/* Gutter */
/* Text */
/* Opened lines sit one level under the fold row. The fold row itself stays on the rail. */
.row-line.in-fold .st-body {
  position: relative;
  padding-left: 18px;
}

.row-line.in-fold .st-body::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 3px;
  width: 7px;
  border-left: 1px solid var(--st-bracket);
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

.st-fold .st-body {
  padding-top: 3px;
  padding-bottom: 10px;
}

.st-fold .st-title {
  flex-wrap: wrap;
  gap: 0 8px;
  color: var(--muted);
  font-size: 13px;
  line-height: 20px;
  transition:
    color 160ms var(--ease),
    background-color var(--dur-2) var(--ease);
}

.st-fold-count {
  color: var(--fg);
  opacity: 0.7;
  transition: opacity 160ms var(--ease);
}

.st-fold:hover .st-title,
.st-fold:focus-visible .st-title {
  color: var(--fg);
}

.st-fold:hover .st-fold-count,
.st-fold:focus-visible .st-fold-count {
  opacity: 1;
}

.st-fold:focus-visible {
  outline: none;
}

.st-fold:focus-visible .st-fold-sum {
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* Current state */
.st-now {
  display: flex;
  flex-wrap: wrap;
  gap: 0 8px;
  align-items: baseline;
  font-size: 13px;
  line-height: 20px;
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

/* A bounded tail: independent rails fade, explicit closing paths converge. */
.st-row.row-future {
  height: 16px;
}

.st-row.row-future.converging {
  height: 32px;
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
