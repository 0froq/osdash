<script setup lang="ts">
import { formatDuration, RECENT_MS, summarize, type BoardItem, type Turn } from '#shared/turn'
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
  if (turn === 'done') {
    return rows
      .filter(item => item.closedAt && generatedMs.value - Date.parse(item.closedAt) <= RECENT_MS)
      .sort((first, second) => Date.parse(second.closedAt ?? '') - Date.parse(first.closedAt ?? ''))
  }
  return [...rows].sort((first, second) => second.ageMs - first.ageMs)
}

const columns = computed(() => [
  { turn: 'me' as const, title: '轮到我', rows: column('me') },
  { turn: 'maintainer' as const, title: '等别人', rows: column('maintainer') },
  { turn: 'done' as const, title: '最近完结', rows: column('done') },
])

const flat = computed(() => columns.value.flatMap(entry => entry.rows))

watch(flat, rows => {
  if (!rows.some(row => row.id === selectedId.value)) selectedId.value = rows[0]?.id ?? ''
})

function move(step: number) {
  const rows = flat.value
  if (rows.length === 0) return
  const index = Math.max(
    0,
    rows.findIndex(row => row.id === selectedId.value),
  )
  const next = Math.min(rows.length - 1, Math.max(0, index + step))
  selectedId.value = rows[next]!.id
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
    error.value = caught instanceof Error ? caught.message : '没有读到看板'
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
  if (ms === null) return '还没有'
  return formatDuration(ms)
}
</script>

<template>
  <main class="board">
    <header class="top">
      <div class="brand">
        <h1>osdash</h1>
        <p class="quiet">0froq 的开源贡献，只读</p>
      </div>
      <p class="hint">
        j / k 移动 · o 打开
        <template v-if="mock"> · 本地样例</template>
        <template v-else-if="cached"> · 缓存</template>
        <template v-if="truncated"> · 只取了前 100 条</template>
      </p>
      <p class="stats">
        已合并 {{ stats.merged }} · 开着 {{ stats.open }} · 平均首次回复
        {{ replyLabel(stats.averageFirstReplyMs) }}
      </p>
      <div class="controls">
        <label>
          <span class="quiet">仓库</span>
          <select v-model="repo">
            <option value="">全部</option>
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
          {{ pending ? '刷新中' : '刷新' }}
        </button>
        <div
          class="theme"
          role="radiogroup"
          aria-label="主题"
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
            浅色
          </button>
          <button
            type="button"
            role="radio"
            data-choice="dark"
            :aria-checked="themeReady ? theme === 'dark' : undefined"
            :tabindex="theme === 'light' ? -1 : 0"
            @click="setTheme('dark')"
          >
            深色
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
      >
        <h2>
          {{ entry.title }}
          <span class="count">{{ entry.rows.length }}</span>
        </h2>
        <p
          v-if="entry.rows.length === 0"
          class="empty"
        >
          没有
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
              {{ formatDuration(row.ageMs) }}
            </p>
          </div>
          <h3 class="title">{{ row.title }}</h3>
          <p class="detail">
            <span>{{ row.reason }}</span>
            <span
              v-for="label in row.labels"
              :key="label"
              class="label"
            >
              {{ label }}
            </span>
          </p>
          <p class="actions">
            <a
              class="button"
              :href="row.links.item"
              target="_blank"
              rel="noreferrer"
            >
              打开 {{ row.kind === 'pr' ? 'PR' : 'issue' }}
            </a>
            <a
              v-if="row.links.comment"
              class="button"
              :href="row.links.comment"
              target="_blank"
              rel="noreferrer"
            >
              打开最后一条评论
            </a>
            <span
              v-else
              class="button disabled"
            >
              打开最后一条评论
            </span>
            <a
              v-if="row.links.ci"
              class="button"
              :href="row.links.ci"
              target="_blank"
              rel="noreferrer"
            >
              打开 CI 日志
            </a>
            <span
              v-else
              class="button disabled"
            >
              打开 CI 日志
            </span>
          </p>
        </article>
      </section>
    </div>
  </main>
</template>
