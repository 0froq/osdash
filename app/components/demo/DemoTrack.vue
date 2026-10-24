<script setup lang="ts">
import {
  gridOf,
  lanesOf,
  rowsOf,
  shortAgo,
  spineOf,
  type Contribution,
  type Line,
  type Tag,
} from '~/demo/contrib'

const props = defineProps<{
  c: Contribution
  nowMs: number
  mode: 'spine' | 'graph'
  wide?: boolean
}>()

const open = ref(new Set<string>())
const sources = ref(false)
watch(
  () => props.c.id,
  () => {
    open.value = new Set()
  },
)

const foldIds = computed(() =>
  props.c.blocks.filter(block => block.type === 'fold').map(block => block.id),
)
const allOpen = computed(
  () => foldIds.value.length > 0 && foldIds.value.every(id => open.value.has(id)),
)

function toggle(id: string) {
  const next = new Set(open.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  open.value = next
}

function toggleAll() {
  open.value = allOpen.value ? new Set() : new Set(foldIds.value)
}

const rows = computed(() => rowsOf(props.c, open.value))
const lanes = computed(() => lanesOf(props.c))
const grid = computed(() =>
  props.mode === 'graph' ? gridOf(props.c, rows.value, lanes.value) : spineOf(props.c, rows.value),
)

const legend = computed(() =>
  lanes.value
    .flatMap((lane, index) => lane.map(item => ({ item, index })))
    .sort(
      (a, b) =>
        props.c.items.findIndex(i => i.key === a.item.key) -
        props.c.items.findIndex(i => i.key === b.item.key),
    ),
)

const word = computed(() => {
  if (props.c.turn === 'you') return 'Your turn'
  if (props.c.turn === 'done') return 'Done'
  return `Waiting ${props.c.now.days}d`
})

const age = computed(() => {
  if (props.c.turn !== 'waiting') return ''
  if (props.c.now.days > 14) return 'late'
  if (props.c.now.days > 7) return 'slow'
  return ''
})

const TAG: Record<Tag, string | null> = { claim: 'claim', maintainer: 'maintainer', reason: null }

function refOf(line: Line): string | null {
  if (line.item === props.c.primary.key || line.start || line.end) return null
  return `on #${props.c.items.find(item => item.key === line.item)!.number}`
}

function stateOf(state: string) {
  return state === 'merged' ? 'merged' : state === 'closed' ? 'closed' : 'open'
}
</script>

<template>
  <div
    class="x-pane ct"
    :class="[`turn-${c.turn}`, `mode-${mode}`, { wide }]"
    :style="{ '--ct-lanes': String(mode === 'graph' ? lanes.length : 1) }"
  >
    <header>
      <p class="x-kicker">{{ c.repo }} · {{ c.category }}</p>
      <h3 class="x-title">{{ c.primary.title }}</h3>
      <div
        class="x-status"
        :class="age"
      >
        <i class="x-mark" />
        <span class="x-status-word">{{ word }}</span>
        <span class="x-status-line">{{ c.now.text }}</span>
        <span class="x-ago">{{ shortAgo(c.now.at, nowMs) }}</span>
      </div>
      <p
        v-if="sources"
        class="ct-src"
      >
        {{ c.now.source }}
      </p>
    </header>

    <ul
      v-if="mode === 'graph'"
      class="ct-legend"
    >
      <li
        v-for="entry in legend"
        :key="entry.item.key"
        class="ct-row"
      >
        <span class="ct-gutter">
          <span
            v-for="(_, l) in lanes"
            :key="l"
            class="ct-cell"
            :class="{ other: !entry.item.mine }"
          >
            <i
              v-if="l === entry.index"
              class="ct-node n-legend"
            />
          </span>
        </span>
        <span class="ct-item">
          <b>#{{ entry.item.number }}</b>
          <span class="ct-item-kind">{{ entry.item.kind === 'pr' ? 'PR' : 'issue' }}</span>
          <span
            class="ct-state"
            :class="`s-${stateOf(entry.item.state)}`"
            >{{ entry.item.state }}</span
          >
          <span class="ct-item-rel">{{ entry.item.relation }}</span>
        </span>
      </li>
    </ul>
    <ul
      v-else-if="c.items.length > 1"
      class="ct-items"
    >
      <li
        v-for="item in c.items"
        :key="item.key"
        :class="{ primary: item.primary }"
      >
        <b>#{{ item.number }}</b>
        <span class="ct-item-kind">{{ item.kind === 'pr' ? 'PR' : 'issue' }}</span>
        <span
          class="ct-state"
          :class="`s-${stateOf(item.state)}`"
          >{{ item.state }}</span
        >
        <span class="ct-item-rel">{{ item.relation }}</span>
      </li>
    </ul>
    <p
      v-if="c.mentions.length"
      class="ct-mentions"
    >
      Mentioned only: {{ c.mentions.map(n => `#${n}`).join(', ') }}. Not part of this card.
    </p>

    <div class="ct-tools">
      <button
        v-if="foldIds.length"
        type="button"
        @click="toggleAll"
      >
        {{ allOpen ? 'Collapse all' : 'Expand all' }}
      </button>
      <button
        type="button"
        :aria-pressed="sources"
        @click="sources = !sources"
      >
        Sources
      </button>
    </div>

    <ol class="ct-list">
      <li
        v-for="(row, r) in rows"
        :key="row.id"
        class="ct-row"
        :class="[
          `row-${row.type}`,
          {
            minor: row.type === 'line' && row.minor,
            ask: row.type === 'line' && row.line.tags.includes('reason'),
          },
        ]"
      >
        <span class="ct-gutter">
          <span
            v-for="(cell, l) in grid[r]"
            :key="l"
            class="ct-cell"
            :class="{ other: !cell.mine, dashed: cell.dashed }"
          >
            <i
              v-if="cell.up"
              class="ct-up"
            />
            <i
              v-if="cell.down"
              class="ct-down"
            />
            <i
              v-if="cell.hl"
              class="ct-h left"
            />
            <i
              v-if="cell.hr"
              class="ct-h right"
            />
            <i
              v-if="cell.node"
              class="ct-node"
              :class="`n-${cell.node}`"
            />
          </span>
        </span>

        <div class="ct-body">
          <template v-if="row.type === 'line'">
            <p
              class="ct-line"
              :class="`tone-${row.line.tone}`"
            >
              <b>{{ row.line.actor }}</b>
              <span class="ct-verb">{{ row.line.verb }}</span>
              <span
                v-if="refOf(row.line)"
                class="ct-ref"
                >{{ refOf(row.line) }}</span
              >
              <template
                v-for="tag in row.line.tags"
                :key="tag"
              >
                <span
                  v-if="TAG[tag]"
                  class="ct-tag"
                  :class="`t-${tag}`"
                  >{{ TAG[tag] }}</span
                >
              </template>
              <span class="ct-ago">{{ shortAgo(row.line.at, nowMs) }}</span>
            </p>
            <p
              v-if="row.line.quote && !row.minor"
              class="ct-quote"
            >
              {{ row.line.quote }}
            </p>
            <p
              v-if="row.line.chips.length"
              class="ct-chips"
            >
              <span
                v-for="chip in row.line.chips"
                :key="chip"
                >{{ chip }}</span
              >
            </p>
            <p
              v-if="sources"
              class="ct-src"
            >
              {{ row.line.source }}
            </p>
          </template>

          <button
            v-else-if="row.type === 'fold'"
            type="button"
            class="ct-fold"
            :aria-expanded="row.open"
            @click="toggle(row.id)"
          >
            <span>{{ row.fold.summary }}</span>
            <span class="ct-fold-act">{{ row.open ? 'Hide' : 'Show' }}</span>
          </button>

          <p
            v-else-if="row.type === 'now'"
            class="ct-now"
          >
            <span class="ct-now-label">Now</span>
            <span>{{ c.now.text }}</span>
          </p>

          <p
            v-else
            class="ct-next"
          >
            <b>{{ row.next.who }}</b>
            <span>{{ row.next.text }}</span>
          </p>
        </div>
      </li>
    </ol>

    <section class="x-notes">
      <p class="x-notes-head">
        <span>Notes on {{ c.repo }}</span>
        <span class="x-notes-add">+ Note</span>
      </p>
      <ul v-if="c.notes.length">
        <li
          v-for="note in c.notes"
          :key="note.at"
        >
          <span>{{ note.text }}</span>
          <span class="x-ago">{{ shortAgo(note.at, nowMs) }}</span>
        </li>
      </ul>
      <p
        v-else
        class="x-notes-empty"
      >
        Nothing yet. Notes stay in osdash and never go to GitHub.
      </p>
    </section>
  </div>
</template>
