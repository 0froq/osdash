import type { MaybeRefOrGetter, Ref } from 'vue'
import type { SidebarGroup, SidebarItem } from './types'
import { computed, shallowRef, toValue, watch } from 'vue'

/** Selection and top-level folding, independent of links, routing and skin. */
export function useSidebar(
  groups: MaybeRefOrGetter<SidebarGroup[]>,
  active: Ref<string>,
  foldable: MaybeRefOrGetter<boolean> = false,
  current?: (item: SidebarItem) => unknown,
) {
  const expanded = shallowRef<Record<string, boolean>>({})

  const isCurrent = (item: SidebarItem) =>
    current ? Boolean(current(item)) : active.value === item.value

  function containsCurrent(item: SidebarItem): boolean {
    return isCurrent(item) || Boolean(item.children?.some(containsCurrent))
  }

  const canFold = (item: SidebarItem) => toValue(foldable) && Boolean(item.children?.length)
  const isExpanded = (item: SidebarItem) =>
    !canFold(item) || (expanded.value[item.value] ?? containsCurrent(item))

  function toggle(item: SidebarItem): void {
    expanded.value = { ...expanded.value, [item.value]: !isExpanded(item) }
  }

  // The value of the current item, whichever way it is decided. Watching `active` alone misses
  // a `current` callback that reads the router, because its identity never changes.
  const currentValue = computed(() => {
    const walk = (items: SidebarItem[]): string | undefined => {
      for (const item of items) {
        if (isCurrent(item)) return item.value
        const inner = item.children && walk(item.children)
        if (inner) return inner
      }
    }
    return walk(toValue(groups).flatMap(group => group.items)) ?? ''
  })

  watch(currentValue, () => {
    for (const item of toValue(groups).flatMap(group => group.items)) {
      if (canFold(item) && containsCurrent(item))
        expanded.value = { ...expanded.value, [item.value]: true }
    }
  })

  return { expanded, containsCurrent, canFold, isExpanded, toggle, currentValue }
}
