<script setup lang="ts">
import { copy } from '~/copy/en'

const rows = 2

const props = defineProps<{
  repos: Array<{ name: string; count: number }>
  active: string[]
}>()

const emit = defineEmits<{ select: [repos: string[]] }>()
const names = computed(() => props.repos.map(repo => repo.name))
const empty = computed(() => props.active.length === 0)
const open = ref(false)
const list = ref<HTMLElement | null>(null)
const overflow = ref(false)
const cap = ref(0)
const full = ref(0)
const hiddenAt = ref(0)

/** Both heights are pixels: max-height cannot transition to auto. */
function measure(): void {
  const el = list.value
  if (!el) return
  const items = [...el.querySelectorAll<HTMLElement>('[data-repo]')]
  const top = el.getBoundingClientRect().top
  const placed = items.map(item => {
    const box = item.getBoundingClientRect()
    return { y: Math.round(box.top - top), bottom: box.bottom - top }
  })
  const rowsAt = [...new Set(placed.map(item => item.y))].sort((a, b) => a - b)
  overflow.value = rowsAt.length > rows
  const edge = rowsAt[rows - 1]
  const past = rowsAt[rows]
  const last = edge === undefined ? undefined : placed.findLast(item => item.y <= edge)
  cap.value = last ? Math.ceil(last.bottom) : 0
  hiddenAt.value = past ?? cap.value
  full.value = el.scrollHeight
  places.value = placed.map(item => item.y)
}

let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(measure)
  if (list.value) observer.observe(list.value)
  measure()
})
onBeforeUnmount(() => observer?.disconnect())
watch(names, () => {
  open.value = false
  nextTick(measure)
})

const places = ref<number[]>([])

function place(index: number): number {
  return places.value[index] ?? 0
}

function on(name: string): boolean {
  return props.active.includes(name)
}

function toggle(name: string): void {
  emit('select', on(name) ? props.active.filter(item => item !== name) : [...props.active, name])
}

/** Keep every repo except the ones currently chosen. */
function invert(): void {
  emit(
    'select',
    names.value.filter(name => !props.active.includes(name)),
  )
}
</script>

<template>
  <div
    v-if="repos.length > 1"
    class="repo-filter"
  >
    <span class="repo-label">{{ copy.repos.label }}</span>
    <div
      ref="list"
      class="repo-list"
      role="group"
      :class="{ 'is-open': open }"
      :aria-label="copy.repos.label"
      :style="
        overflow
          ? { 'maxHeight': `${open ? full : cap}px`, '--repo-cut': String(hiddenAt) }
          : undefined
      "
    >
      <button
        type="button"
        class="repo-chip"
        data-repo
        :style="{ '--repo-y': '0' }"
        :aria-pressed="empty"
        @click="emit('select', [])"
      >
        <span class="repo-reveal">{{ copy.repos.all }}</span>
      </button>
      <button
        v-for="(repo, index) in repos"
        :key="repo.name"
        type="button"
        class="repo-chip"
        data-repo
        :style="{ '--repo-y': String(place(index + 1)) }"
        :aria-pressed="on(repo.name)"
        @click="toggle(repo.name)"
      >
        <span class="repo-reveal"
          >{{ repo.name }} <span class="repo-count">{{ repo.count }}</span></span
        >
      </button>
      <button
        type="button"
        class="repo-invert"
        data-repo
        :style="{ '--repo-y': String(place(repos.length + 1)) }"
        :disabled="empty"
        @click="invert"
      >
        <span class="repo-reveal">{{ copy.repos.invert }}</span>
      </button>
    </div>
    <button
      v-if="overflow"
      type="button"
      class="repo-more"
      :aria-expanded="open"
      @click="open = !open"
    >
      {{ open ? copy.repos.showLess : copy.repos.showAll }}
    </button>
  </div>
</template>

<style scoped>
.repo-filter {
  display: grid;
  gap: 10px;
  min-width: 0;
  margin-top: 20px;
}

.repo-label {
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.repo-list {
  --reveal: calc(var(--repo-y, 0) * 1px - var(--repo-cut, 0) * 1px);
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  align-items: baseline;
  overflow: hidden;
  transition: max-height var(--dur-3) var(--ease);
}

/* Rows past the cut rise and fade in with the height, instead of being sliced. */
.repo-reveal {
  display: inline-block;
  transition:
    opacity var(--dur-3) var(--ease),
    translate var(--dur-3) var(--ease);
}

.repo-list:not(.is-open) .repo-reveal {
  opacity: clamp(0, calc(1 - var(--reveal) / 28), 1);
  translate: 0 clamp(0px, calc(var(--reveal) * 0.45), 10px);
}

.repo-more {
  justify-self: start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--muted);
  cursor: pointer;
  font-family: var(--font-meta);
  font-size: 11px;
  letter-spacing: 0.02em;
}

.repo-more:hover,
.repo-more:focus-visible {
  color: var(--fg);
  outline: none;
}

.repo-chip,
.repo-invert {
  padding: 0;
  border: 0;
  background: none;
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-size: 13.5px;
  line-height: 1.5;
  transition: color 160ms var(--ease);
}

.repo-chip:hover,
.repo-chip:focus-visible,
.repo-invert:hover:not(:disabled),
.repo-invert:focus-visible {
  color: var(--fg);
  outline: none;
}

/* Same mark as a card title: drawn in from the left, sitting under the word. */
.repo-chip {
  background-image: linear-gradient(
    100deg,
    transparent 0.2em,
    color-mix(in oklab, var(--accent) 20%, transparent) 0.35em,
    color-mix(in oklab, var(--accent) 20%, transparent) calc(100% - 0.35em),
    transparent calc(100% - 0.15em)
  );
  background-repeat: no-repeat;
  background-position: 0 88%;
  background-size: 0 46%;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  transition:
    color 160ms var(--ease),
    background-size var(--dur-3) var(--ease);
}

.repo-chip[aria-pressed='true'] {
  background-size: 100% 46%;
  color: var(--fg);
}

.repo-invert {
  border-bottom: 1px dashed color-mix(in oklab, var(--fg) 35%, transparent);
  font-family: var(--font-meta);
  font-size: 11px;
  letter-spacing: 0.04em;
}

.repo-invert:disabled {
  color: var(--faint, var(--muted));
  cursor: not-allowed;
  opacity: 0.5;
}

.repo-count {
  font-family: var(--font-meta);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
</style>
