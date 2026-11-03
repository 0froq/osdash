import type { SidebarCurrent, SidebarGroup, SidebarItem, SidebarLinkProps } from '@froq/ui'
import type { NavGroup, NavItem } from './navigation'

const NAV_HASH = /^#/
const target = (to: string, link: (to: string) => string) => (NAV_HASH.test(to) ? to : link(to))

export function toSidebarItems(entries: NavItem[], link: (to: string) => string): SidebarItem[] {
  return entries.map(item => ({
    value: item.to,
    label: item.label,
    href: target(item.to, link),
    children: item.children ? toSidebarItems(item.children, link) : undefined,
  }))
}

export function toSidebarGroups(groups: NavGroup[], link: (to: string) => string): SidebarGroup[] {
  return groups.map(group => ({ label: group.label, items: toSidebarItems(group.items, link) }))
}

/** Link props for a router link: NuxtLink takes `to`, so `href` has to go, and click handling stays. */
export function routerLinkProps({ href: _href, ...attrs }: SidebarLinkProps) {
  return attrs
}

/**
 * Hash marks an in-page location, a path marks the page.
 * `item.href` is already resolved, so this stays a string compare. It runs for every item on every
 * render, and resolving the route again here is what made clicks feel late.
 */
export function useSidebarCurrent(): SidebarCurrent {
  const route = useRoute()
  return item =>
    item.value.startsWith('#')
      ? route.hash === item.value && 'location'
      : route.path === item.href && 'page'
}
