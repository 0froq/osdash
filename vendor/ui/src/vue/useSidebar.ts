import type { MaybeRefOrGetter, Ref } from 'vue'
import type { SidebarGroup, SidebarItem } from './types'
import { shallowRef, toValue, watch } from 'vue'

/** Selection and top-level folding, independent of links, routing and skin. */
export function useSidebar(groups: MaybeRefOrGetter<SidebarGroup[]>, active: Ref<string>, foldable: MaybeRefOrGetter<boolean> = false) {
  const expanded = shallowRef<Record<string, boolean>>({})

  function containsCurrent(item: SidebarItem): boolean {
    return item.value === active.value || Boolean(item.children?.some(containsCurrent))
  }

  const canFold = (item: SidebarItem) => toValue(foldable) && Boolean(item.children?.length)
  const isExpanded = (item: SidebarItem) => !canFold(item) || (expanded.value[item.value] ?? containsCurrent(item))

  function toggle(item: SidebarItem): void {
    expanded.value = { ...expanded.value, [item.value]: !isExpanded(item) }
  }

  watch(active, () => {
    for (const item of toValue(groups).flatMap(group => group.items)) {
      if (canFold(item) && containsCurrent(item))
        expanded.value = { ...expanded.value, [item.value]: true }
    }
  })

  return { expanded, containsCurrent, canFold, isExpanded, toggle }
}
