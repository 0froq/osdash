<script setup lang="ts">
import type { PickOption } from '../../vue'
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{
    label: string
    options: PickOption[]
    /** Rows shown before the list truncates; 0 shows everything. */
    rows?: number
    moreLabel?: string
    lessLabel?: string
    dir?: 'ltr' | 'rtl'
    loop?: boolean
    disabled?: boolean
  }>(),
  {
    rows: 2,
    moreLabel: 'Show all',
    lessLabel: 'Show less',
    loop: true,
    disabled: false,
  },
)
defineSlots<{
  option?: (scope: { option: PickOption; active: boolean }) => unknown
  /** Extra controls rendered inside the list flow (Clear, Invert, …). They are
      measured like options, so the row cap and the reveal motion cover them. */
  extra?: () => unknown
}>()
const model = defineModel<string[]>({ default: () => [] })
const id = useId()
const { wrapperAttrs, controlAttrs } = useControlAttrs()

const selected = computed(() => (Array.isArray(model.value) ? model.value : []))
function active(option: PickOption): boolean {
  return selected.value.includes(option.value)
}
function update(next: unknown) {
  if (props.disabled) return
  model.value = Array.isArray(next)
    ? next.filter((item): item is string => typeof item === 'string')
    : []
}

/*
 * Collapse: the list is a flex wrap, so rows are measured from each child's
 * offsetTop. `cap` is the height that keeps `rows` rows, `full` the natural
 * height — max-height transitions between the two. `cut` is the first hidden
 * row's top; each child carries its own top in --pick-y, so while collapsed a
 * child fades and sinks as its top passes the cut.
 *
 * `ref` on the reka root yields the component instance; the element is its $el.
 */
const list = ref<HTMLElement | { $el?: HTMLElement } | null>(null)
function listEl(): HTMLElement | null {
  const node = list.value
  if (node instanceof HTMLElement) return node
  return node?.$el ?? null
}

const open = ref(false)
const overflow = ref(false)
const cap = ref(0)
const full = ref(0)
const cut = ref(0)

function measure(): void {
  const el = listEl()
  if (!el) return
  const items = [...el.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  )
  const tops = items.map(child => child.offsetTop)
  const rowsAt = [...new Set(tops)].sort((a, b) => a - b)
  const kept = Math.max(1, props.rows)
  overflow.value = props.rows > 0 && rowsAt.length > kept
  const edge = rowsAt[kept - 1]
  const last = edge === undefined ? undefined : items.findLast((_, index) => tops[index]! <= edge)
  cap.value = last ? last.offsetTop + last.offsetHeight : 0
  cut.value = rowsAt[kept] ?? cap.value
  full.value = el.scrollHeight
  items.forEach((child, index) => {
    child.style.setProperty('--pick-y', String(tops[index] ?? 0))
  })
}

let observer: ResizeObserver | undefined
onMounted(() => {
  const el = listEl()
  if (el) {
    observer = new ResizeObserver(measure)
    observer.observe(el)
  }
  measure()
  document.fonts?.ready.then(measure).catch(() => {})
})
onBeforeUnmount(() => observer?.disconnect())
watch(
  () => [props.options, props.rows],
  () => nextTick(measure),
  { deep: true },
)
</script>

<template>
  <div
    v-bind="wrapperAttrs()"
    class="ui-pick"
  >
    <span
      :id="id"
      class="ui-pick-label"
      >{{ label }}</span
    >
    <ToggleGroupRoot
      v-bind="controlAttrs()"
      ref="list"
      type="multiple"
      class="ui-pick-list"
      :class="{ 'is-open': open }"
      :aria-labelledby="id"
      :dir="dir"
      :loop="loop"
      :disabled="disabled"
      :model-value="selected"
      :style="{
        '--pick-cut': cut,
        'maxHeight': overflow ? `${open ? full : cap}px` : undefined,
      }"
      @update:model-value="update"
    >
      <ToggleGroupItem
        v-for="option in options"
        :key="option.value"
        class="ui-pick-item"
        :value="option.value"
        :disabled="option.disabled"
      >
        <slot
          name="option"
          :option="option"
          :active="active(option)"
        >
          {{ option.label
          }}<span
            v-if="option.count !== undefined"
            class="ui-pick-count"
            >&nbsp;{{ option.count }}</span
          >
        </slot>
      </ToggleGroupItem>
      <slot name="extra" />
    </ToggleGroupRoot>
    <button
      v-if="overflow"
      type="button"
      class="ui-pick-more ui-pick-quiet"
      :aria-expanded="open"
      @click="open = !open"
    >
      {{ open ? lessLabel : moreLabel }}
    </button>
  </div>
</template>

<style scoped>
/* The measure pass writes each child's row top into --pick-y and the first
   hidden row's top into --pick-cut; the reveal math reads the difference. */
@property --pick-y {
  syntax: '<number>';
  inherits: false;
  initial-value: 0;
}

@property --pick-cut {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}

.ui-pick {
  display: grid;
  min-width: 0;
  gap: 10px;
  justify-items: start;
}

.ui-pick-label {
  color: var(--ui-muted);
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ui-pick-list {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  align-items: baseline;
  padding-inline: 6px;
  margin-inline: -6px;
  overflow: hidden;
  font-family: var(--ui-font-text);
  font-size: 14px;
  line-height: 1.5;
  transition: max-height var(--ui-dur) var(--ui-ease);
}

/* Children past the cut rise and fade with the opening height. */
.ui-pick-list > * {
  transition:
    opacity var(--ui-dur) var(--ui-ease),
    translate var(--ui-dur) var(--ui-ease);
}

.ui-pick-list:not(.is-open) > * {
  opacity: clamp(0, calc(1 - (var(--pick-y, 0) - var(--pick-cut, 0)) / 28), 1);
  translate: 0 clamp(0px, calc((var(--pick-y, 0) - var(--pick-cut, 0)) * 0.45px), 10px);
}

/* A token that toggles: a quiet word with a capsule riding its leading edge,
   the same checked mark the value lists draw (Sidebar, Menu, Select): line
   while idle, accent once the value joins the set. The 5px pad (and matching
   negative margin) is hover-wash room, so text keeps its edge; the list's own
   padding keeps that wash and the capsule inside the clip box. */
.ui-pick-item {
  position: relative;
  padding: 1px 5px;
  border: 0;
  border-radius: var(--ui-radius-sm, 3px);
  margin: -1px -5px;
  background: none;
  color: var(--ui-muted);
  cursor: pointer;
  font: inherit;
  transition:
    color var(--ui-dur) var(--ui-ease),
    background-color var(--ui-dur) var(--ui-ease),
    opacity var(--ui-dur) var(--ui-ease),
    translate var(--ui-dur) var(--ui-ease);
}

.ui-pick-item::before {
  position: absolute;
  top: 50%;
  inset-inline-start: 0;
  width: 3px;
  height: 10px;
  border-radius: 1px;
  background: var(--ui-line);
  content: '';
  transform: translate(-30%, -50%);
  transition: background-color var(--ui-dur) var(--ui-ease);
}

.ui-pick-item:hover:not(:disabled) {
  background: color-mix(in srgb, var(--ui-fg) 4%, transparent);
  color: var(--ui-fg);
}

.ui-pick-item:hover:not(:disabled):not([data-state='on'])::before {
  background: var(--ui-faint);
}

.ui-pick-item[data-state='on'] {
  color: var(--ui-fg);
}

.ui-pick-item[data-state='on']::before {
  background: var(--ui-accent);
}

.ui-pick-item:disabled {
  cursor: default;
  opacity: 0.5;
}

.ui-pick-item:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 3px;
}

.ui-pick-count {
  font-family: var(--ui-font-meta);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
</style>

/*#extra controls are caller-owned: they carry .ui-pick-quiet to pick up the quiet-action skin, and
the un-scoped block keeps it reachable from slots. The skin is a dashed underline at meta size — the
action frame's dash, collapsed into a rule, so the control sits inside a flow of words. */
<style>
.ui-pick-quiet {
  display: inline-flex;
  gap: 5px;
  align-items: baseline;
  padding: 0 0 1px;
  border: 0;
  border-bottom: 1px dashed var(--ui-line);
  background: none;
  color: var(--ui-muted);
  cursor: pointer;
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.02em;
  transition:
    color var(--ui-dur) var(--ui-ease),
    border-color var(--ui-dur) var(--ui-ease);
}

.ui-pick-quiet:hover:not(:disabled) {
  border-bottom-style: solid;
  border-bottom-color: var(--ui-fg);
  color: var(--ui-fg);
}

.ui-pick-quiet:disabled {
  cursor: default;
  opacity: 0.5;
}

.ui-pick-quiet:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 3px;
}
</style>
