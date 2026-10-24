<script setup lang="ts">
import type { UnitCategory } from '#shared/unit'
import type { InboxViewer } from '~/composables/useInbox'
import { copy } from '~/copy/en'
import { categoryLabel } from '~/utils/category'

export type InboxViewName = 'home' | 'later' | 'starred' | 'ended'

defineProps<{
  viewer: InboxViewer
  pending: boolean
  view: InboxViewName
  category: UnitCategory | null
  homeCount: number
  laterCount: number
  starredCount: number
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
</script>

<template>
  <aside class="sidebar">
    <p class="logo">{{ copy.brand }}</p>
    <nav
      class="side-nav"
      :aria-label="copy.nav.home"
    >
      <button
        class="side-link"
        :class="{ current: view === 'home' && !category }"
        type="button"
        @click="emit('view', 'home')"
      >
        <span>{{ copy.nav.home }}</span>
        <span class="side-count">{{ homeCount }}</span>
      </button>
      <button
        class="side-link"
        :class="{ current: view === 'later' }"
        type="button"
        @click="emit('view', 'later')"
      >
        <span>{{ copy.nav.later }}</span>
        <span class="side-count">{{ laterCount }}</span>
      </button>
      <button
        class="side-link"
        :class="{ current: view === 'starred' }"
        type="button"
        @click="emit('view', 'starred')"
      >
        <span>{{ copy.nav.starred }}</span>
        <span class="side-count">{{ starredCount }}</span>
      </button>
      <button
        class="side-link"
        :class="{ current: view === 'ended' }"
        type="button"
        @click="emit('view', 'ended')"
      >
        <span>{{ copy.sections.ended }}</span>
        <span class="side-count">{{ endedCount }}</span>
      </button>
      <p class="side-label">{{ copy.nav.kinds }}</p>
      <button
        v-for="item in categories"
        :key="item"
        class="side-link"
        :class="{ current: category === item }"
        type="button"
        @click="emit('category', item)"
      >
        <span>{{ categoryLabel(item) }}</span>
        <span class="side-count">{{ categoryCounts[item] }}</span>
      </button>
    </nav>
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
.side-nav {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  margin-top: 32px;
  overflow: auto;
}

.side-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 36px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-row);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-family: var(--font-text);
  font-size: 13.5px;
  text-align: left;
  transition:
    background-color var(--dur-1) var(--ease),
    color var(--dur-1) var(--ease);
}

.side-link:hover {
  background: var(--soft);
  color: var(--fg);
}

.side-link.current {
  background: var(--soft-2);
  color: var(--fg);
  font-weight: 500;
}

.side-count {
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11.5px;
  font-weight: 400;
}

.side-link.current .side-count {
  color: var(--fg);
}

.side-label {
  padding: 22px 10px 6px;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11px;
  letter-spacing: 0.06em;
}

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
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 1;
}

.sidebar .logo {
  padding: 0 10px;
}
</style>
