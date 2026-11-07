<script setup lang="ts">
import { Sidebar as UiSidebar } from '@froq/ui'
import type { SidebarGroup } from '@froq/ui'
import type { UnitCategory } from '#shared/unit'
const { t } = useI18n()
import { categoryLabel } from '~/utils/category'

export type InboxViewName = 'home' | 'ended'

const props = defineProps<{
  view: InboxViewName
  category: UnitCategory | null
  homeCount: number
  categoryCounts: Record<UnitCategory, number>
}>()

const emit = defineEmits<{
  view: [view: InboxViewName]
  category: [category: UnitCategory]
}>()

const categories: UnitCategory[] = ['claimed-fix', 'direct-pr', 'reported', 'helped']
const active = computed(() => props.category ?? props.view)
const groups = computed<SidebarGroup[]>(() => [
  {
    items: [{ value: 'home', label: t('nav.home') }],
  },
  {
    label: t('nav.kinds'),
    items: categories.map(category => ({ value: category, label: categoryLabel(t, category) })),
  },
])
const counts = computed<Record<string, number>>(() => ({
  home: props.homeCount,
  ...props.categoryCounts,
}))

function select(value: string): void {
  if (value === 'home') emit('view', value)
  else {
    const category = categories.find(item => item === value)
    if (category) emit('category', category)
  }
}
</script>

<template>
  <div class="sidebar">
    <UiSidebar
      class="side-nav"
      :model-value="active"
      :groups="groups"
      :aria-label="t('nav.home')"
      @update:model-value="select"
    >
      <template #link="{ item, props: linkProps }">
        <a
          v-bind="linkProps"
          class="side-link"
        >
          <span>{{ item.label }}</span>
          <span class="side-count">{{ counts[item.value] }}</span>
        </a>
      </template>
    </UiSidebar>
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
  min-height: 0;
}

.side-nav {
  flex: 1;
  overflow: auto;
}

/* Same link skin the library draws on ui.froq.me: the selection pill and
   accent edge need the .ui-sidebar-link class to measure against. Two-class
   selector keeps our flex layout above the library's block link. */
.ui-sidebar-link.side-link {
  display: flex;
  justify-content: space-between;
}

.side-count {
  align-self: center;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

.side-link[aria-current] .side-count {
  color: var(--fg);
}
</style>
