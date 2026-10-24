<script setup lang="ts">
import { ago, itemOf, stepRef, type Step, type Story, type StoryItem } from '~/demo/story'

const props = defineProps<{ story: Story; nowMs: number; wide?: boolean }>()

type Row = {
  id: string
  kind: 'next' | 'now' | 'step'
  item: string
  step?: Step
  actor?: string
  text?: string
}

type Cell = {
  v: boolean
  capTop: boolean
  capBottom: boolean
  node: boolean
  left: boolean
  right: boolean
  target: boolean
}

const lanes = computed<StoryItem[]>(() => {
  const order: string[] = []
  for (const step of props.story.steps) if (!order.includes(step.item)) order.push(step.item)
  return order.map(key => itemOf(props.story, key))
})

const rows = computed<Row[]>(() => [
  ...[...props.story.next].reverse().map((next, index) => ({
    id: `next-${index}`,
    kind: 'next' as const,
    item: next.item,
    actor: next.actor,
    text: next.text,
  })),
  { id: 'now', kind: 'now' as const, item: props.story.current },
  ...[...props.story.steps].reverse().map(step => ({
    id: step.id,
    kind: 'step' as const,
    item: step.item,
    step,
  })),
])

const grid = computed<Cell[][]>(() => {
  const nowRow = rows.value.findIndex(row => row.kind === 'now')
  const ranges = lanes.value.map(lane => {
    const hits = rows.value.flatMap((row, index) => (row.item === lane.key ? [index] : []))
    if (lane.state === 'open') hits.push(nowRow)
    return { min: Math.min(...hits), max: Math.max(...hits) }
  })
  return rows.value.map((row, r) => {
    const cells = lanes.value.map((lane, l): Cell => {
      const range = ranges[l]!
      const active = r >= range.min && r <= range.max
      return {
        v: active && range.min !== range.max,
        capTop: r === range.min,
        capBottom: r === range.max,
        node: row.item === lane.key,
        left: false,
        right: false,
        target: false,
      }
    })
    const from = lanes.value.findIndex(lane => lane.key === row.item)
    for (const link of row.step?.links ?? []) {
      const to = lanes.value.findIndex(lane => lane.key === link.to)
      if (to < 0 || to === from) continue
      const lo = Math.min(from, to)
      const hi = Math.max(from, to)
      for (let l = lo; l <= hi; l += 1) {
        if (l > lo) cells[l]!.left = true
        if (l < hi) cells[l]!.right = true
      }
      cells[to]!.target = true
    }
    return cells
  })
})
</script>

<template>
  <div
    class="x-pane gr"
    :class="[`turn-${story.turn}`, { wide }]"
    :style="{ '--gr-lanes': String(lanes.length) }"
  >
    <DemoStoryHead
      :story="story"
      :now-ms="nowMs"
    />

    <ul class="gr-legend">
      <li
        v-for="(lane, index) in lanes"
        :key="lane.key"
        class="gr-row"
      >
        <span class="gr-gutter">
          <span
            v-for="(other, l) in lanes"
            :key="other.key"
            class="gr-cell"
            :class="`role-${other.role}`"
          >
            <i
              v-if="l === index"
              class="gr-dot legend"
            />
          </span>
        </span>
        <span class="gr-legend-text">
          <b>#{{ lane.number }}</b>
          <span>{{ lane.kind === 'pr' ? 'PR' : 'issue' }} · {{ lane.state }}</span>
          <span class="gr-legend-rel">{{ lane.relation }}</span>
        </span>
      </li>
    </ul>

    <ol class="gr-list">
      <li
        v-for="(row, r) in rows"
        :key="row.id"
        class="gr-row"
        :class="[
          `row-${row.kind}`,
          row.step ? `k-${row.step.kind}` : '',
          row.kind === 'now' ? `turn-${story.turn}` : '',
        ]"
      >
        <span class="gr-gutter">
          <span
            v-for="(cell, l) in grid[r]"
            :key="l"
            class="gr-cell"
            :class="`role-${lanes[l]!.role}`"
          >
            <i
              v-if="cell.v"
              class="gr-v"
              :class="{ 'cap-top': cell.capTop, 'cap-bottom': cell.capBottom }"
            />
            <i
              v-if="cell.left"
              class="gr-h left"
            />
            <i
              v-if="cell.right"
              class="gr-h right"
            />
            <i
              v-if="cell.target"
              class="gr-target"
            />
            <i
              v-if="cell.node"
              class="gr-dot"
            />
          </span>
        </span>
        <div class="gr-body">
          <template v-if="row.kind === 'now'">
            <p class="gr-now-label">Now</p>
            <p class="gr-now-line">{{ story.now }}</p>
          </template>
          <p
            v-else-if="row.kind === 'next'"
            class="gr-line"
          >
            <b>{{ row.actor }}</b>
            <span>{{ row.text }}</span>
          </p>
          <template v-else-if="row.step">
            <p class="gr-line">
              <span
                v-if="row.step.kind === 'note'"
                class="sp-note-tag"
                >Your note</span
              >
              <template v-else>
                <b>{{ row.step.actor }}</b>
                <span>{{ row.step.text }}</span>
              </template>
              <span
                v-if="stepRef(story, row.step)"
                class="sp-ref"
                >{{ stepRef(story, row.step) }}</span
              >
              <span class="sp-ago">{{ ago(row.step.at, nowMs) }}</span>
            </p>
            <p
              v-if="row.step.quote && (row.step.id === story.askId || row.step.kind === 'note')"
              class="sp-quote"
            >
              {{ row.step.quote }}
            </p>
            <p
              v-if="row.step.machineTone === 'bad' || (wide && row.step.machine)"
              class="sp-machine"
              :class="row.step.machineTone"
            >
              {{ row.step.machine }}
            </p>
            <p
              v-if="row.step.links?.length"
              class="sp-links"
            >
              <span
                v-for="link in row.step.links"
                :key="link.to"
                >{{ link.label }} #{{ itemOf(story, link.to).number }}</span
              >
            </p>
          </template>
        </div>
      </li>
    </ol>

    <DemoRepoNotes
      :story="story"
      :now-ms="nowMs"
    />
  </div>
</template>
