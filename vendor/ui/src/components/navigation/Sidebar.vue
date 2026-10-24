<script setup lang="ts">
import type { SidebarGroup, SidebarItem, SidebarLinkProps } from '../../vue'
import { onBeforeUnmount, onMounted, useId, useTemplateRef, watch } from 'vue'
import { prefersReducedMotion } from '../../core'
import { useNavigation, useSidebar } from '../../vue'
import SidebarTree from './Sidebar.vue'

const props = withDefaults(defineProps<{
  groups: SidebarGroup[]
  foldable?: boolean
  /** Internal recursion level; consumers only pass groups and foldable. */
  nested?: boolean
}>(), { foldable: false, nested: false })
defineSlots<{
  link?: (scope: { item: SidebarItem, props: SidebarLinkProps }) => unknown
}>()
const model = defineModel<string>({ default: '' })
const { isActive, activate } = useNavigation(model)
const branchId = useId()
const { expanded, containsCurrent, canFold, isExpanded, toggle } = useSidebar(
  () => props.groups,
  model,
  () => props.foldable && !props.nested,
)

function linkProps(item: SidebarItem): SidebarLinkProps {
  return {
    'class': 'ui-sidebar-link',
    'href': item.href ?? '#',
    'aria-current': isActive(item) ? 'page' : undefined,
    'onClick': event => activate(event, item),
  }
}

const groupElements = useTemplateRef<HTMLElement[]>('groupElements')

function updateSelection(animate = true): void {
  if (props.nested)
    return
  for (const group of groupElements.value ?? []) {
    const selection = group.querySelector<HTMLElement>(':scope > .ui-sidebar-selection')
    const candidates = Array.from(group.querySelectorAll<HTMLElement>('.ui-sidebar-link[aria-current], .is-current-branch > .ui-sidebar-link'))
      .filter(element => element.getClientRects().length)
    const active = candidates.find(element => element.hasAttribute('aria-current')) ?? candidates[0]
    if (!selection)
      continue
    if (!active) {
      group.classList.remove('has-selection')
      selection.hidden = true
      continue
    }
    const bounds = group.getBoundingClientRect()
    const rect = active.getBoundingClientRect()
    const transform = `translate(${rect.left - bounds.left}px, ${rect.top - bounds.top}px)`
    const width = `${rect.width}px`
    const height = `${rect.height}px`
    if (!selection.hidden && selection.style.transform === transform && selection.style.width === width && selection.style.height === height)
      continue
    selection.style.transition = animate && !selection.hidden && !prefersReducedMotion() ? '' : 'none'
    selection.style.transform = transform
    selection.style.width = width
    selection.style.height = height
    selection.hidden = false
    group.classList.add('has-selection')
    // Establish the position before enabling subsequent same-group transitions.
    selection.getBoundingClientRect()
  }
}

let resizeObserver: ResizeObserver | undefined
function observeGroups(): void {
  resizeObserver?.disconnect()
  for (const group of groupElements.value ?? [])
    resizeObserver?.observe(group)
}
onMounted(async () => {
  updateSelection(false)
  if (props.nested)
    return
  resizeObserver = new ResizeObserver(() => updateSelection(false))
  observeGroups()
  await document.fonts?.ready
  updateSelection(false)
})
watch([model, () => props.groups, () => props.foldable, expanded], () => {
  observeGroups()
  updateSelection()
}, { flush: 'post' })
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
          :class="{ 'has-children': item.children?.length, 'is-current-branch': containsCurrent(item), 'is-foldable': canFold(item) }"
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
          <SidebarTree
            v-if="item.children?.length"
            v-show="isExpanded(item)"
            :id="`${branchId}-${encodeURIComponent(item.value)}`"
            v-model="model"
            :groups="[{ items: item.children }]"
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
        </li>
      </ul>
    </div>
  </component>
</template>
