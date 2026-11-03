<script setup lang="ts">
import type { ComponentSource, ComponentSourceEntry, ComponentSourceOptions } from '../../vue'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useComponentSources } from '../../vue'

const props = defineProps<ComponentSourceOptions>()

interface Group {
  file: string
  name: string
  source: ComponentSource
  path: string
  entries: ComponentSourceEntry[]
}
interface Box {
  key: string
  name: string
  source: ComponentSource
  hover: boolean
  top: number
  left: number
  width: number
  height: number
}

const ROUTES = /[\\/](?:pages|layouts)[\\/]|[\\/](?:app|error)\.vue$/

const ready = ref(false)
const open = ref(false)
const showLibrary = ref(false)
const showProject = ref(false)
const showRoutes = ref(false)
const hovered = ref<string>()
const boxes = shallowRef<Box[]>([])
const root = ref<HTMLElement>()
const { entries, scan } = useComponentSources(props)

const groups = computed<Group[]>(() => {
  const byFile = new Map<string, Group>()
  for (const entry of entries.value) {
    if (!showRoutes.value && ROUTES.test(entry.file)) continue
    const group = byFile.get(entry.file) ?? {
      file: entry.file,
      name: entry.name,
      source: entry.source,
      path: entry.file.replace(/^.*?[\\/](app|src|vendor[\\/]ui[\\/]src)[\\/]/, '$1/'),
      entries: [],
    }
    group.entries.push(entry)
    byFile.set(entry.file, group)
  }
  return [...byFile.values()].sort(
    (a, b) => b.entries.length - a.entries.length || a.name.localeCompare(b.name),
  )
})
const project = computed(() => groups.value.filter(group => group.source === 'project'))
const library = computed(() => groups.value.filter(group => group.source === 'library'))
const active = computed(() => open.value || showLibrary.value || showProject.value)

function measure(): void {
  const next: Box[] = []
  for (const group of groups.value) {
    const hover = hovered.value === group.file
    const shown = hover || (group.source === 'library' ? showLibrary.value : showProject.value)
    if (!shown) continue
    group.entries.forEach((entry, index) => {
      entry.elements.forEach((element, part) => {
        const rect = element.getBoundingClientRect()
        if (rect.width && rect.height)
          next.push({
            key: `${group.file}:${index}:${part}`,
            name: group.name,
            source: group.source,
            hover,
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          })
      })
    })
  }
  boxes.value = next
}

let frame = 0
let rescan = false
function schedule(full = false): void {
  rescan ||= full
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    if (rescan) scan()
    rescan = false
    measure()
  })
}

const observer =
  typeof MutationObserver === 'undefined'
    ? undefined
    : new MutationObserver(records => {
        if (records.some(record => !root.value?.contains(record.target))) schedule(true)
      })
const layout = () => schedule()

function attach(): void {
  observer?.observe(document.body, { childList: true, subtree: true, attributes: true })
  window.addEventListener('scroll', layout, { capture: true, passive: true })
  window.addEventListener('resize', layout, { passive: true })
  schedule(true)
}
function detach(): void {
  observer?.disconnect()
  window.removeEventListener('scroll', layout, { capture: true })
  window.removeEventListener('resize', layout)
  boxes.value = []
}

watch(active, on => (on ? attach() : detach()))
watch([showLibrary, showProject, showRoutes, hovered], () => schedule())

function reveal(group: Group): void {
  group.entries[0]?.elements[0]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

onMounted(() => {
  ready.value = process.env.NODE_ENV !== 'production'
})
onBeforeUnmount(() => {
  detach()
  cancelAnimationFrame(frame)
})
</script>

<template>
  <div
    v-if="ready"
    ref="root"
    class="ui-devtools"
  >
    <div
      class="ui-devtools-layer"
      aria-hidden="true"
    >
      <span
        v-for="box in boxes"
        :key="box.key"
        class="ui-devtools-box"
        :class="[`is-${box.source}`, { 'is-hover': box.hover }]"
        :style="{
          top: `${box.top}px`,
          left: `${box.left}px`,
          width: `${box.width}px`,
          height: `${box.height}px`,
        }"
      >
        <span class="ui-devtools-tag">{{ box.name }}</span>
      </span>
    </div>
    <button
      type="button"
      class="ui-devtools-toggle"
      :aria-expanded="open"
      aria-label="Component sources"
      @click="open = !open"
    >
      ui
    </button>
    <section
      v-if="open"
      class="ui-devtools-panel"
      aria-label="Component sources"
    >
      <div class="ui-devtools-controls">
        <label class="ui-devtools-switch is-library">
          <input
            v-model="showLibrary"
            type="checkbox"
          />
          Library {{ library.length }}
        </label>
        <label class="ui-devtools-switch is-project">
          <input
            v-model="showProject"
            type="checkbox"
          />
          Project {{ project.length }}
        </label>
        <label class="ui-devtools-switch">
          <input
            v-model="showRoutes"
            type="checkbox"
          />
          Pages
        </label>
      </div>
      <div
        v-for="list in [
          { title: 'Not in the library', items: project },
          { title: 'From the library', items: library },
        ]"
        :key="list.title"
        class="ui-devtools-list"
      >
        <h2 class="ui-devtools-heading">
          {{ list.title }}
        </h2>
        <p
          v-if="!list.items.length"
          class="ui-devtools-empty"
        >
          None on this page.
        </p>
        <button
          v-for="group in list.items"
          :key="group.file"
          type="button"
          class="ui-devtools-item"
          :class="`is-${group.source}`"
          :title="group.file"
          @pointerenter="hovered = group.file"
          @pointerleave="hovered = undefined"
          @focus="hovered = group.file"
          @blur="hovered = undefined"
          @click="reveal(group)"
        >
          <span class="ui-devtools-name">{{ group.name }}</span>
          <span class="ui-devtools-path">{{ group.path }}</span>
          <span class="ui-devtools-count">{{ group.entries.length }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ui-devtools-layer {
  position: fixed;
  inset: 0;
  z-index: 1100;
  pointer-events: none;
}

.ui-devtools-box {
  position: fixed;
  box-sizing: border-box;
  border: 1px solid var(--ui-accent);
}

.ui-devtools-box.is-project {
  border: 1px dashed var(--ui-fg);
}

.ui-devtools-box.is-hover {
  border-width: 2px;
  background: color-mix(in srgb, var(--ui-accent) 10%, transparent);
}

.ui-devtools-box.is-project.is-hover {
  background: color-mix(in srgb, var(--ui-fg) 8%, transparent);
}

.ui-devtools-tag {
  position: absolute;
  top: 0;
  left: 0;
  max-width: 100%;
  padding: 0 4px;
  overflow: hidden;
  background: var(--ui-accent);
  color: var(--ui-bg);
  font: 10px/1.5 var(--ui-font-meta);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-devtools-box.is-project .ui-devtools-tag {
  background: var(--ui-fg);
}

.ui-devtools-toggle {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1101;
  padding: 4px 10px;
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  background: var(--ui-bg);
  box-shadow: 0 0 20px 10px var(--ui-bg);
  color: var(--ui-muted);
  font: 11px/1.6 var(--ui-font-meta);
  cursor: pointer;
  transition: color var(--ui-dur) var(--ui-ease);
}

.ui-devtools-toggle:hover,
.ui-devtools-toggle[aria-expanded='true'] {
  color: var(--ui-fg);
}

.ui-devtools-panel {
  position: fixed;
  right: 16px;
  bottom: 56px;
  z-index: 1101;
  box-sizing: border-box;
  width: min(24rem, calc(100vw - 32px));
  max-height: min(34rem, 70dvh);
  padding: 12px;
  overflow-y: auto;
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  background: var(--ui-bg);
  box-shadow: 0 0 20px 10px var(--ui-bg);
  color: var(--ui-fg);
  font: 12px/1.5 var(--ui-font-meta);
}

.ui-devtools-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ui-line);
}

.ui-devtools-switch {
  display: flex;
  gap: 6px;
  align-items: center;
  cursor: pointer;
}

.ui-devtools-switch :deep(input) {
  margin: 0;
  accent-color: var(--ui-fg);
}

.ui-devtools-switch.is-library :deep(input) {
  accent-color: var(--ui-accent);
}

.ui-devtools-heading {
  margin: 16px 0 6px;
  color: var(--ui-muted);
  font: inherit;
}

.ui-devtools-empty {
  margin: 0;
  color: var(--ui-faint);
}

.ui-devtools-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0 12px;
  width: 100%;
  padding: 4px 0;
  border: 0;
  background: none;
  color: var(--ui-fg);
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.ui-devtools-item.is-library .ui-devtools-name {
  color: var(--ui-accent);
}

.ui-devtools-item:hover,
.ui-devtools-item:focus-visible {
  background: color-mix(in srgb, var(--ui-fg) 6%, transparent);
  outline: none;
}

.ui-devtools-path {
  grid-column: 1;
  overflow: hidden;
  color: var(--ui-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-devtools-count {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  color: var(--ui-muted);
  font-variant-numeric: tabular-nums;
}
</style>
