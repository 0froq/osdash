<script setup lang="ts">
import { copy } from '~/copy/en'

const props = defineProps<{
  repos: Array<{ name: string; count: number }>
  active: string
}>()

const emit = defineEmits<{ select: [repo: string] }>()

const row = ref<HTMLElement | null>(null)
const expanded = ref(false)
const overflows = ref(false)
const hiddenFrom = ref<number | null>(null)

function measure(): void {
  const el = row.value
  if (!el) return
  const pills = [...el.querySelectorAll<HTMLElement>('[data-pill]')]
  const tops = [...new Set(pills.map(pill => pill.offsetTop))].sort((left, right) => left - right)
  const clipped = !expanded.value && el.scrollHeight > el.clientHeight + 1
  const overflow = tops.length > 3 || clipped
  overflows.value = overflow
  if (!overflow) {
    hiddenFrom.value = null
    return
  }
  const limit = tops[2] ?? 0
  const index = pills.findIndex(pill => pill.offsetTop > limit + 1)
  hiddenFrom.value = index === -1 ? null : index
}

function toggle(): void {
  expanded.value = !expanded.value
}

watch(
  () => props.repos,
  () => {
    expanded.value = false
    void nextTick(measure)
  },
)

watch(row, (el, _previous, onCleanup) => {
  void nextTick(measure)
  if (!el || typeof ResizeObserver === 'undefined') return
  const observer = new ResizeObserver(() => measure())
  observer.observe(el)
  onCleanup(() => observer.disconnect())
})
</script>

<template>
  <div
    v-if="repos.length > 1"
    class="repo-block"
  >
    <div
      ref="row"
      class="repo-row"
      :class="{ expanded }"
    >
      <button
        v-for="(repo, index) in repos"
        :key="repo.name"
        class="repo-chip"
        :class="{ current: repo.name === active }"
        type="button"
        data-pill
        :inert="!expanded && hiddenFrom !== null && index >= hiddenFrom ? true : undefined"
        @click="emit('select', repo.name === active ? '' : repo.name)"
      >
        {{ repo.name }}
        <span class="repo-count">{{ repo.count }}</span>
      </button>
    </div>
    <button
      v-if="overflows"
      class="repo-toggle"
      type="button"
      :aria-expanded="expanded"
      @click="toggle"
    >
      {{ expanded ? copy.repos.showLess : copy.repos.showAll }}
    </button>
  </div>
</template>
