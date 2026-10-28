<script setup lang="ts">
import { Sidebar as UiSidebar } from '@froq/ui'
import type { SidebarGroup } from '@froq/ui'
import type { UnitCategory } from '#shared/unit'
import type { InboxViewer } from '~/composables/useInbox'
import { copy } from '~/copy/en'
import { categoryLabel } from '~/utils/category'

export type InboxViewName = 'home' | 'ended'

const props = defineProps<{
  viewer: InboxViewer
  pending: boolean
  view: InboxViewName
  category: UnitCategory | null
  homeCount: number
  endedCount: number
  categoryCounts: Record<UnitCategory, number>
}>()

const emit = defineEmits<{
  refresh: []
  logout: []
  settings: []
  view: [view: InboxViewName]
  category: [category: UnitCategory]
}>()

const categories: UnitCategory[] = ['claimed-fix', 'direct-pr', 'reported', 'helped']
const active = computed(() => props.category ?? props.view)
const groups = computed<SidebarGroup[]>(() => [
  {
    items: [
      { value: 'home', label: copy.nav.home },
      { value: 'ended', label: copy.sections.ended },
    ],
  },
  {
    label: copy.nav.kinds,
    items: categories.map(category => ({ value: category, label: categoryLabel(category) })),
  },
])
const counts = computed<Record<string, number>>(() => ({
  home: props.homeCount,
  ended: props.endedCount,
  ...props.categoryCounts,
}))

function select(value: string): void {
  if (value === 'home' || value === 'ended') emit('view', value)
  else {
    const category = categories.find(item => item === value)
    if (category) emit('category', category)
  }
}
</script>

<template>
  <aside class="sidebar">
    <p class="logo">{{ copy.brand }}</p>
    <UiSidebar
      class="side-nav"
      :model-value="active"
      :groups="groups"
      :aria-label="copy.nav.home"
      @update:model-value="select"
    >
      <template #link="{ item, props: linkProps }">
        <button
          v-bind="{ ...linkProps, href: undefined }"
          class="side-link"
          type="button"
        >
          <span>{{ item.label }}</span>
          <span class="side-count">{{ counts[item.value] }}</span>
        </button>
      </template>
    </UiSidebar>
    <SidebarMenu
      :name="viewer.name || viewer.login"
      :avatar-url="viewer.avatarUrl"
      :pending="pending"
      @refresh="emit('refresh')"
      @logout="emit('logout')"
      @settings="emit('settings')"
    />
  </aside>
</template>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 28px 12px 16px;
  border-right: 1px solid var(--line);
}

.logo {
  padding: 0 10px;
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 1;
}

.side-nav {
  flex: 1;
  margin-top: 32px;
  overflow: auto;
}

.side-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: 0;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.side-count {
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

.side-link[aria-current] .side-count {
  color: var(--fg);
}
</style>
