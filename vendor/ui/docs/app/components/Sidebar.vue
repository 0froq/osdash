<script setup lang="ts">
import type { SidebarItem, SidebarLinkProps } from '@froq/ui'
import { Sidebar as UiSidebar } from '@froq/ui'

const props = withDefaults(defineProps<{
  groups: NavGroup[]
  foldable?: boolean
}>(), { foldable: false })
const route = useRoute()
const link = useSiteLink()
const target = (to: string) => to.startsWith('#') ? to : link(to)

function items(entries: NavItem[]): SidebarItem[] {
  return entries.map(item => ({
    value: item.to,
    label: item.label,
    href: target(item.to),
    children: item.children ? items(item.children) : undefined,
  }))
}
const groups = computed(() => props.groups.map(group => ({
  label: group.label,
  items: items(group.items),
})))

function current(entries: NavItem[]): string | undefined {
  for (const item of entries) {
    if (item.to.startsWith('#') ? route.hash === item.to : route.path === target(item.to))
      return item.to
    const child = item.children && current(item.children)
    if (child)
      return child
  }
}
const active = computed(() => {
  for (const group of props.groups) {
    const value = current(group.items)
    if (value)
      return value
  }
  return ''
})

// NuxtLink owns navigation; only the confirmed route changes selection.
function routerLinkProps({ href: _href, onClick: _onClick, ...attrs }: SidebarLinkProps) {
  return attrs
}
</script>

<template>
  <UiSidebar
    class="docs-sidebar"
    :groups="groups"
    :model-value="active"
    :foldable="foldable"
  >
    <template #link="{ item, props: linkProps }">
      <NuxtLink
        v-bind="routerLinkProps(linkProps)"
        :to="item.href!"
        :aria-current="linkProps['aria-current'] ? item.value.startsWith('#') ? 'location' : 'page' : undefined"
      >
        {{ item.label }}
      </NuxtLink>
    </template>
  </UiSidebar>
</template>

<style scoped>
@media (max-width: 860px) {
  .docs-sidebar {
    max-height: 40dvh;
    padding: 0 12px 12px 0;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    scrollbar-width: thin;
    border-bottom: 1px solid var(--ui-line);
  }
}
</style>
