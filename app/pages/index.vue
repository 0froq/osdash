<script setup lang="ts">
import {
  contributionLabel,
  formatDuration,
  formatTimer,
  RECENT_MS,
  summarize,
  turnLabel,
  type BoardItem,
  type Turn,
} from '#shared/turn'
import { THEME_KEY } from '~/theme'

type ThemeName = 'light' | 'dark'

type BoardResponse = {
  generatedAt: string
  cached: boolean
  truncated: boolean
  mock: boolean
  stats: ReturnType<typeof summarize>
  items: BoardItem[]
}

const items = ref<BoardItem[]>([])
const generatedAt = ref<string | null>(null)
const cached = ref(false)
const truncated = ref(false)
const mock = ref(false)
const pending = ref(true)
const error = ref('')
const repo = ref('')
const selectedId = ref('')
const theme = ref<ThemeName>('light')
const themeReady = ref(false)
const themes = ['light', 'dark'] as const

const repos = computed(() => [...new Set(items.value.map(item => item.repo))].sort())

const visible = computed(() => {
  const filtered = repo.value ? items.value.filter(item => item.repo === repo.value) : items.value
  return filtered
})

const stats = computed(() => summarize(visible.value))

const generatedMs = computed(() => (generatedAt.value ? Date.parse(generatedAt.value) : Date.now()))

function column(turn: Turn): BoardItem[] {
  const rows = visible.value.filter(item => item.turn === turn)
  if (turn === 'none') {
    return rows
      .filter(item => {
        if (item.state === 'open') return true
        return item.closedAt !== null && generatedMs.value - Date.parse(item.closedAt) <= RECENT_MS
      })
      .sort((first, second) => Date.parse(second.closedAt ?? '') - Date.parse(first.closedAt ?? ''))
  }
  return [...rows].sort((first, second) => second.ageMs - first.ageMs)
}

const columns = computed(() => [
  { turn: 'mine' as const, title: 'Mine', rows: column('mine') },
  { turn: 'maintainer' as const, title: 'Maintainer', rows: column('maintainer') },
  { turn: 'other' as const, title: 'Other', rows: column('other') },
  { turn: 'none' as const, title: 'None', rows: column('none') },
])

const flat = computed(() => columns.value.flatMap(entry => entry.rows))

watch(flat, rows => {
  if (!rows.some(row => row.id === selectedId.value)) selectedId.value = rows[0]?.id ?? ''
})

function reveal(id: string) {
  selectedId.value = id
  document.getElementById(id)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

function move(step: number) {
  const rows = flat.value
  if (rows.length === 0) return
  const index = Math.max(
    0,
    rows.findIndex(row => row.id === selectedId.value),
  )
  const next = Math.min(rows.length - 1, Math.max(0, index + step))
  reveal(rows[next]!.id)
}

function moveGroup(step: number) {
  const groups = columns.value.filter(entry => entry.rows.length > 0)
  if (groups.length === 0) return
  const current = groups.findIndex(entry => entry.rows.some(row => row.id === selectedId.value))
  const next = Math.min(groups.length - 1, Math.max(0, current + step))
  const row = groups[next]?.rows[0]
  if (!row) return
  reveal(row.id)
}

function openSelected() {
  const row = flat.value.find(item => item.id === selectedId.value)
  if (!row) return
  window.open(row.links.item, '_blank', 'noopener')
}

function setTheme(next: ThemeName): void {
  theme.value = next
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(THEME_KEY, next)
  } catch {
    /* Storage may be unavailable; the current theme still applies. */
  }
}

function onThemeKey(event: KeyboardEvent): void {
  const step =
    event.key === 'ArrowRight' || event.key === 'ArrowDown'
      ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? -1
        : 0
  if (step === 0) return
  event.preventDefault()
  const index = Math.max(0, themes.indexOf(theme.value))
  const next = themes[(index + step + themes.length) % themes.length]
  if (!next) return
  setTheme(next)
  const group = event.currentTarget
  if (group instanceof HTMLElement)
    group.querySelectorAll<HTMLElement>('[role="radio"]')[themes.indexOf(next)]?.focus()
}

function onKey(event: KeyboardEvent) {
  const target = event.target
  if (target instanceof HTMLElement && target.closest('input, textarea, select')) return
  if (event.key === 'j') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'k') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'h') {
    event.preventDefault()
    moveGroup(-1)
  } else if (event.key === 'l') {
    event.preventDefault()
    moveGroup(1)
  } else if (event.key === 'o') {
    event.preventDefault()
    openSelected()
  }
}

async function load(refresh = false) {
  pending.value = true
  error.value = ''
  const params = new URLSearchParams()
  if (import.meta.dev) params.set('mock', '1')
  if (refresh) params.set('refresh', '1')
  const query = params.size > 0 ? `?${params.toString()}` : ''
  try {
    const body = await $fetch<BoardResponse>(`/api/board${query}`)
    items.value = body.items
    generatedAt.value = body.generatedAt
    cached.value = body.cached
    truncated.value = body.truncated
    mock.value = body.mock
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Could not load board'
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  theme.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  themeReady.value = true
  window.addEventListener('keydown', onKey)
  void load(false)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})

function replyLabel(ms: number | null): string {
  if (ms === null) return '—'
  return formatDuration(ms)
}
</script>

<template>
  <main class="board">
    <header class="top">
      <div class="brand">
        <h1>osdash</h1>
        <p class="quiet">0froq open-source contributions, read-only</p>
      </div>
      <p class="hint">
        h / l groups · j / k move · o open
        <template v-if="mock"> · local sample</template>
        <template v-else-if="cached"> · cached</template>
        <template v-if="truncated"> · capped at 100</template>
      </p>
      <p class="stats">
        Merged {{ stats.merged }} · Open {{ stats.open }} · avg first reply
        {{ replyLabel(stats.averageFirstReplyMs) }}
      </p>
      <div class="controls">
        <label>
          <span class="quiet">Repo</span>
          <select v-model="repo">
            <option value="">All</option>
            <option
              v-for="name in repos"
              :key="name"
              :value="name"
            >
              {{ name }}
            </option>
          </select>
        </label>
        <button
          class="refresh"
          type="button"
          :disabled="pending"
          @click="load(true)"
        >
          {{ pending ? 'Refreshing…' : 'Refresh' }}
        </button>
        <div
          class="theme"
          role="radiogroup"
          aria-label="Theme"
          @keydown="onThemeKey"
        >
          <button
            type="button"
            role="radio"
            data-choice="light"
            :aria-checked="themeReady ? theme === 'light' : undefined"
            :tabindex="theme === 'dark' ? -1 : 0"
            @click="setTheme('light')"
          >
            Light
          </button>
          <button
            type="button"
            role="radio"
            data-choice="dark"
            :aria-checked="themeReady ? theme === 'dark' : undefined"
            :tabindex="theme === 'light' ? -1 : 0"
            @click="setTheme('dark')"
          >
            Dark
          </button>
        </div>
      </div>
    </header>

    <p
      v-if="error"
      class="error"
    >
      {{ error }}
    </p>

    <div class="columns">
      <section
        v-for="entry in columns"
        :key="entry.turn"
        class="column"
        :class="[entry.turn, { active: entry.rows.some(row => row.id === selectedId) }]"
      >
        <h2>
          {{ entry.title }}
          <span class="count">{{ entry.rows.length }}</span>
        </h2>
        <p
          v-if="entry.rows.length === 0"
          class="empty"
        >
          None
        </p>
        <article
          v-for="row in entry.rows"
          :id="row.id"
          :key="row.id"
          class="row"
          :class="{ selected: row.id === selectedId }"
          @click="selectedId = row.id"
        >
          <div class="head">
            <p class="repo">{{ row.repo }} #{{ row.number }}</p>
            <p
              class="age"
              :class="row.tone"
            >
              {{ formatTimer(row.ageMs) }}
            </p>
          </div>
          <h3 class="title">{{ row.title }}</h3>
          <p class="chips">
            <span
              v-for="type in row.contributions"
              :key="type"
              class="chip"
            >
              {{ contributionLabel(type) }}
            </span>
            <span
              class="chip turn"
              :class="row.turn"
            >
              {{ turnLabel(row.turn) }}
            </span>
            <span
              v-for="mark in row.marks"
              :key="mark"
              class="chip mark"
            >
              {{ mark }}
            </span>
          </p>
          <p class="detail">
            <span>{{ row.quote ?? row.reason }}</span>
            <span
              v-for="label in row.labels"
              :key="label"
              class="label"
            >
              {{ label }}
            </span>
          </p>
          <p
            v-if="row.parts.length > 1"
            class="parts"
          >
            <a
              v-for="part in row.parts"
              :key="part.url"
              class="button"
              :href="part.url"
              target="_blank"
              rel="noreferrer"
            >
              {{ part.kind === 'pr' ? 'PR' : 'Issue' }} #{{ part.number }}
            </a>
          </p>
          <p class="actions">
            <a
              class="button"
              :href="row.links.item"
              target="_blank"
              rel="noreferrer"
            >
              Open {{ row.kind === 'pr' ? 'PR' : 'issue' }}
            </a>
            <a
              v-if="row.links.comment"
              class="button"
              :href="row.links.comment"
              target="_blank"
              rel="noreferrer"
            >
              Open latest comment
            </a>
            <span
              v-else
              class="button disabled"
            >
              Open latest comment
            </span>
            <a
              v-if="row.links.ci"
              class="button"
              :href="row.links.ci"
              target="_blank"
              rel="noreferrer"
            >
              Open CI log
            </a>
            <span
              v-else
              class="button disabled"
            >
              Open CI log
            </span>
          </p>
        </article>
      </section>
    </div>
  </main>
</template>
