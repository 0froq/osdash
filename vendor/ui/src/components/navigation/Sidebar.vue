<script setup lang="ts">
import type { SidebarCurrent, SidebarGroup, SidebarItem, SidebarLinkProps } from '../../vue'
import { computed, onBeforeUnmount, onMounted, useId, useTemplateRef, watch } from 'vue'
import { prefersReducedMotion } from '../../core'
import { useNavigation, useSidebar } from '../../vue'
import SidebarTree from './Sidebar.vue'

const props = withDefaults(
  defineProps<{
    groups: SidebarGroup[]
    foldable?: boolean
    /** Internal recursion level; consumers only pass groups and foldable. */
    nested?: boolean
    /** Decide which item is current, and whether that is a page or an in-page location. The default compares item.value with v-model. */
    current?: SidebarCurrent
  }>(),
  { foldable: false, nested: false, current: undefined },
)
defineSlots<{
  link?: (scope: { item: SidebarItem; props: SidebarLinkProps }) => unknown
}>()
const model = defineModel<string>({ default: '' })
const { isActive, activate } = useNavigation(model)
const branchId = useId()
const { expanded, containsCurrent, canFold, isExpanded, toggle, currentValue } = useSidebar(
  () => props.groups,
  model,
  () => props.foldable && !props.nested,
  props.current ? item => Boolean(currentOf(item)) : undefined,
)

// With `current`, the caller owns selection and v-model only holds a click that is still pending.
// A pending click wins at once, so the frame moves before a slow route change confirms it.
function currentOf(item: SidebarItem): 'page' | 'location' | undefined {
  if (props.current && !model.value) return props.current(item) || undefined
  return isActive(item) ? (item.href?.startsWith('#') ? 'location' : 'page') : undefined
}

// What the caller says is current, ignoring any pending click.
const confirmed = computed(() => {
  const { current } = props
  if (!current) return ''
  const walk = (items: SidebarItem[]): string | undefined => {
    for (const item of items) {
      if (current(item)) return item.value
      const inner = item.children && walk(item.children)
      if (inner) return inner
    }
  }
  return walk(props.groups.flatMap(group => group.items)) ?? ''
})
let pendingTimer: ReturnType<typeof setTimeout> | undefined
if (!props.nested) {
  // The route caught up, or never will (a refused navigation): drop the pending click.
  watch(confirmed, () => {
    if (props.current) model.value = ''
  })
  watch(model, value => {
    clearTimeout(pendingTimer)
    if (value && props.current) pendingTimer = setTimeout(() => (model.value = ''), 4000)
  })
  onBeforeUnmount(() => clearTimeout(pendingTimer))
}

function linkProps(item: SidebarItem): SidebarLinkProps {
  return {
    'class': 'ui-sidebar-link',
    'href': item.href ?? '#',
    'aria-current': currentOf(item),
    'onClick': event => activate(event, item),
  }
}

/** The deepest current descendant, so a folded branch can still show where the page is. */
function currentChild(item: SidebarItem): SidebarItem | undefined {
  for (const child of item.children ?? []) {
    if (currentOf(child)) return child
    const deeper = currentChild(child)
    if (deeper) return deeper
  }
}

const groupElements = useTemplateRef<HTMLElement[]>('groupElements')
// Groups whose pill has handed over to a peek row.
const docked = new WeakSet<HTMLElement>()

function updateSelection(animate = true): void {
  if (props.nested) return
  for (const group of groupElements.value ?? []) {
    const selection = group.querySelector<HTMLElement>(':scope > .ui-sidebar-selection')
    const candidates = Array.from(
      group.querySelectorAll<HTMLElement>(
        '.ui-sidebar-link[aria-current], .is-current-branch > .ui-sidebar-link',
      ),
    ).filter(element => element.getClientRects().length && !element.closest('[inert]'))
    const active = candidates.find(element => element.hasAttribute('aria-current')) ?? candidates[0]
    if (!selection) continue
    if (!active) {
      docked.delete(group)
      selection.classList.remove('is-docked')
      group.classList.remove('has-selection')
      selection.hidden = true
      continue
    }
    // A folded branch shows its current child in a peek row that carries its own highlight.
    // The pill fades out with that row instead of racing the fold on its own timeline.
    if (active.closest('.ui-sidebar-peek')) {
      docked.add(group)
      selection.classList.add('is-docked')
      group.classList.remove('has-selection')
      continue
    }
    const wasDocked = docked.delete(group)
    selection.classList.remove('is-docked')
    group.classList.add('has-selection')
    const bounds = group.getBoundingClientRect()
    const rect = active.getBoundingClientRect()
    const transform = `translate(${rect.left - bounds.left}px, ${rect.top - bounds.top}px)`
    const width = `${rect.width}px`
    const height = `${rect.height}px`
    if (
      !selection.hidden &&
      selection.style.transform === transform &&
      selection.style.width === width &&
      selection.style.height === height
    )
      continue
    selection.style.transition =
      animate && !wasDocked && !selection.hidden && !prefersReducedMotion() ? '' : 'none'
    selection.style.transform = transform
    selection.style.width = width
    selection.style.height = height
    selection.hidden = false
    group.classList.add('has-selection')
    // Commit the position, then hand control back to the stylesheet so the next move can animate.
    selection.getBoundingClientRect()
    selection.style.transition = ''
  }
}

let resizeObserver: ResizeObserver | undefined
function observeGroups(): void {
  resizeObserver?.disconnect()
  for (const group of groupElements.value ?? []) resizeObserver?.observe(group)
}
onMounted(async () => {
  updateSelection(false)
  if (props.nested) return
  // A click usually resizes the group too. An instant update here would cancel the move that click started.
  resizeObserver = new ResizeObserver(() => updateSelection())
  observeGroups()
  await document.fonts?.ready
  updateSelection(false)
})
watch(
  [currentValue, () => props.groups, () => props.foldable, expanded],
  () => {
    observeGroups()
    updateSelection()
  },
  { flush: 'post' },
)
onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <component
    :is="nested ? 'div' : 'nav'"
    class="ui-sidebar"
    :class="{ 'is-nested': nested }"
  >
    <div
      v-for="(group, index) in groups"
      :key="index"
      ref="groupElements"
      class="ui-sidebar-group"
    >
      <p
        v-if="group.label"
        class="ui-sidebar-label"
      >
        {{ group.label }}
      </p>
      <div
        v-if="!nested"
        class="ui-sidebar-selection"
        aria-hidden="true"
        hidden
      />
      <ul class="ui-sidebar-list">
        <li
          v-for="item in group.items"
          :key="item.value"
          class="ui-sidebar-branch"
          :class="{
            'has-children': item.children?.length,
            'is-current-branch': containsCurrent(item),
            'is-foldable': canFold(item),
          }"
        >
          <slot
            name="link"
            :item="item"
            :props="linkProps(item)"
          >
            <a v-bind="linkProps(item)">{{ item.label }}</a>
          </slot>
          <button
            v-if="canFold(item)"
            type="button"
            class="ui-sidebar-fold"
            :aria-label="item.label"
            :aria-expanded="isExpanded(item)"
            :aria-controls="`${branchId}-${encodeURIComponent(item.value)}`"
            @click="toggle(item)"
          >
            <span aria-hidden="true" />
          </button>
          <div
            v-if="item.children?.length"
            class="ui-sidebar-panel"
            :class="{ 'is-open': isExpanded(item) }"
            :inert="isExpanded(item) ? undefined : true"
          >
            <div class="ui-sidebar-clip">
              <SidebarTree
                :id="`${branchId}-${encodeURIComponent(item.value)}`"
                v-model="model"
                :groups="[{ items: item.children }]"
                :current="current"
                nested
              >
                <template #link="scope">
                  <slot
                    name="link"
                    v-bind="scope"
                  >
                    <a v-bind="scope.props">{{ scope.item.label }}</a>
                  </slot>
                </template>
              </SidebarTree>
            </div>
          </div>
          <div
            v-if="canFold(item) && currentChild(item)"
            class="ui-sidebar-peek"
            :class="{ 'is-shown': !isExpanded(item) }"
            :inert="isExpanded(item) ? true : undefined"
          >
            <div class="ui-sidebar-clip">
              <div class="ui-sidebar-peek-body">
                <slot
                  name="link"
                  :item="currentChild(item)!"
                  :props="linkProps(currentChild(item)!)"
                >
                  <a v-bind="linkProps(currentChild(item)!)">{{ currentChild(item)!.label }}</a>
                </slot>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </component>
</template>

<style scoped>
.ui-sidebar {
  position: relative;
  display: grid;
  align-content: start;
  gap: 36px;
  min-width: 0;
  font-family: var(--ui-font-text);
  font-size: 0.875rem;
  line-height: 1.4;
}

.ui-sidebar-group {
  position: relative;
  display: grid;
  gap: 14px;
  min-width: 0;
}

.ui-sidebar-list {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ui-sidebar-branch {
  position: relative;
  min-width: 0;
}

.ui-sidebar-panel {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 320ms var(--ui-ease),
    opacity 180ms var(--ui-ease);
}

.ui-sidebar-panel.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
}

.ui-sidebar-clip {
  min-height: 0;
  overflow: hidden;
}

/* A folded branch keeps its current child visible, smaller and indented under the branch link. */
.ui-sidebar-peek {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 320ms var(--ui-ease),
    opacity 180ms var(--ui-ease);
}

.ui-sidebar-peek.is-shown {
  grid-template-rows: 1fr;
  opacity: 1;
}

.ui-sidebar-peek-body {
  margin: 2px 0 4px 10px;
}

.ui-sidebar-peek-body :deep(.ui-sidebar-link) {
  padding-block: 5px;
  color: var(--ui-fg);
  font-size: 0.8125rem;
}

.ui-sidebar-branch.is-foldable > :deep(.ui-sidebar-link) {
  padding-inline-end: 34px;
}

.ui-sidebar-fold {
  position: absolute;
  z-index: 2;
  inset-block-start: 0;
  inset-inline-end: 0;
  display: grid;
  place-items: center;
  width: 32px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: var(--ui-radius);
  color: var(--ui-muted);
  background: transparent;
  cursor: pointer;
}

.ui-sidebar-fold:hover {
  color: var(--ui-fg);
  background: color-mix(in srgb, var(--ui-fg) 4%, transparent);
}

.ui-sidebar-fold :deep(span) {
  width: 5px;
  height: 5px;
  border-inline-end: 1px solid currentColor;
  border-block-end: 1px solid currentColor;
  transform: rotate(-45deg);
}

.ui-sidebar-fold[aria-expanded='true'] :deep(span) {
  transform: rotate(45deg);
}

.ui-sidebar-branch.has-children + .ui-sidebar-branch,
.ui-sidebar-branch + .ui-sidebar-branch.has-children {
  margin-block-start: 12px;
}

.ui-sidebar-label {
  margin: 0;
  color: var(--ui-fg);
  font-family: var(--ui-font-display);
  font-size: 1.875rem;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.025em;
}

:deep(.ui-sidebar-link) {
  position: relative;
  z-index: 1;
  display: block;
  padding: 7px 10px;
  border-radius: var(--ui-radius);
  color: color-mix(in srgb, var(--ui-fg) 72%, var(--ui-bg));
  text-decoration: none;
  overflow-wrap: anywhere;
  transition:
    color var(--ui-dur) var(--ui-ease),
    background-color var(--ui-dur) var(--ui-ease);
}

.ui-sidebar-branch.has-children > :deep(.ui-sidebar-link) {
  color: var(--ui-fg);
  font-size: 0.875rem;
}

:deep(.ui-sidebar-link:hover) {
  color: var(--ui-fg);
  background: color-mix(in srgb, var(--ui-fg) 4%, transparent);
}

:deep(.ui-sidebar-link[aria-current]) {
  color: var(--ui-fg);
  background: color-mix(in srgb, var(--ui-fg) 6%, transparent);
}

:deep(.ui-sidebar-link[aria-current]::before),
.ui-sidebar-selection::before {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 0;
  width: 3px;
  height: 14px;
  max-height: calc(100% - 12px);
  border-radius: 1px;
  background: var(--ui-accent);
  transform: translate(-30%, -50%);
  content: '';
}

.ui-sidebar-selection {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: var(--ui-radius);
  background: color-mix(in srgb, var(--ui-fg) 6%, transparent);
  pointer-events: none;
  transition:
    transform var(--ui-dur) var(--ui-ease),
    width var(--ui-dur) var(--ui-ease),
    height var(--ui-dur) var(--ui-ease),
    opacity 180ms var(--ui-ease) 140ms;
}

/* Docked in a peek row: fade out at once, and fade back in once the list has mostly opened. */
.ui-sidebar-selection.is-docked {
  opacity: 0;
  transition: opacity 120ms var(--ui-ease);
}

.ui-sidebar-group.has-selection :deep(.ui-sidebar-link[aria-current]) {
  background: transparent;
}

.ui-sidebar-group.has-selection :deep(.ui-sidebar-link[aria-current]::before) {
  content: none;
}

@media (prefers-reduced-motion: reduce) {
  .ui-sidebar-selection,
  .ui-sidebar-panel,
  .ui-sidebar-peek {
    transition: none;
  }
}

:deep(.ui-sidebar-link:focus-visible),
.ui-sidebar-fold:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 2px;
}

.ui-sidebar.is-nested {
  gap: 2px;
  margin: 2px 0 4px 10px;
  padding: 0;
  font-size: 0.8125rem;
}

.ui-sidebar.is-nested .ui-sidebar-list {
  padding-inline-start: 10px;
  border-inline-start: 1px solid var(--ui-line);
}

.ui-sidebar.is-nested :deep(.ui-sidebar-link) {
  padding-block: 5px;
  color: color-mix(in srgb, var(--ui-fg) 74%, var(--ui-bg));
}

.ui-sidebar.is-nested :deep(.ui-sidebar-link:hover),
.ui-sidebar.is-nested :deep(.ui-sidebar-link[aria-current]),
.ui-sidebar.is-nested .ui-sidebar-branch.has-children > :deep(.ui-sidebar-link),
.ui-sidebar-branch.is-current-branch > :deep(.ui-sidebar-link) {
  color: var(--ui-fg);
}
</style>
