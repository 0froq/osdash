<script setup lang="ts">
import type { UnitCategory } from '#shared/unit'
import type { InboxViewer } from '~/composables/useInbox'
import type { InboxViewName } from '~/components/inbox/Sidebar.vue'
import { copy } from '~/copy/en'
import { categoryLabel } from '~/utils/category'

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
  <header class="mobile-nav">
    <div class="mobile-bar">
      <p class="logo">{{ copy.brand }}</p>
      <SidebarMenu
        :name="viewer.name || viewer.login"
        :avatar-url="viewer.avatarUrl"
        :pending="pending"
        @refresh="emit('refresh')"
        @logout="emit('logout')"
        @settings="emit('settings')"
      />
    </div>
    <nav
      class="tab-row"
      :aria-label="copy.nav.home"
    >
      <button
        class="nav-tab"
        :class="{ current: view === 'home' && !category }"
        type="button"
        @click="emit('view', 'home')"
      >
        {{ copy.nav.home }}
        <span class="nav-count">{{ homeCount }}</span>
      </button>
      <button
        class="nav-tab"
        :class="{ current: view === 'later' }"
        type="button"
        @click="emit('view', 'later')"
      >
        {{ copy.nav.later }}
        <span class="nav-count">{{ laterCount }}</span>
      </button>
      <button
        class="nav-tab"
        :class="{ current: view === 'starred' }"
        type="button"
        @click="emit('view', 'starred')"
      >
        {{ copy.nav.starred }}
        <span class="nav-count">{{ starredCount }}</span>
      </button>
      <button
        class="nav-tab"
        :class="{ current: view === 'ended' }"
        type="button"
        @click="emit('view', 'ended')"
      >
        {{ copy.sections.ended }}
        <span class="nav-count">{{ endedCount }}</span>
      </button>
    </nav>
    <nav
      class="chip-row"
      :aria-label="copy.nav.kinds"
    >
      <button
        v-for="item in categories"
        :key="item"
        class="nav-chip"
        :class="{ current: category === item }"
        type="button"
        @click="emit('category', item)"
      >
        {{ categoryLabel(item) }}
        <span class="nav-count">{{ categoryCounts[item] }}</span>
      </button>
    </nav>
  </header>
</template>

<style scoped>
.nav-count {
  font-family: var(--font-meta);
  font-size: 11.5px;
  font-weight: 400;
}

.mobile-nav {
  display: none;
}

@media (max-width: 760px) {
  .mobile-nav {
    position: sticky;
    top: 0;
    z-index: 4;
    display: block;
    min-width: 0;
    padding: 8px var(--main-pad) 0;
    background: color-mix(in oklab, var(--bg) 88%, transparent);
    backdrop-filter: blur(12px);
  }

  .mobile-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
  }

  .mobile-bar .logo {
    font-size: 22px;
  }

  .mobile-bar .viewer-name {
    display: none;
  }

  .mobile-bar .viewer-menu {
    margin-top: 0;
  }

  .mobile-bar .viewer-button {
    width: auto;
    min-height: 40px;
    padding: 6px;
  }

  .mobile-bar .menu-pop {
    --pop-origin: top right;
    top: calc(100% + 4px);
    right: 0;
    bottom: auto;
    left: auto;
  }

  .tab-row,
  .chip-row,
  .repo-row {
    scrollbar-width: none;
  }

  .tab-row {
    display: flex;
    gap: 20px;
    min-width: 0;
    overflow-x: auto;
  }

  .nav-tab {
    display: inline-flex;
    flex: 0 0 auto;
    gap: 5px;
    align-items: baseline;
    min-height: 36px;
    padding: 0;
    border: 0;
    color: var(--muted);
    cursor: pointer;
    font-size: 13.5px;
    transition: color var(--dur-1) var(--ease);
  }

  .nav-tab.current {
    color: var(--fg);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 6px;
  }

  .chip-row {
    display: flex;
    gap: 6px;
    min-width: 0;
    padding: 2px 0 10px;
    overflow-x: auto;
  }

  .nav-chip {
    display: inline-flex;
    flex: 0 0 auto;
    gap: 5px;
    align-items: center;
    min-height: 36px;
    padding: 0 12px;
    border: 0;
    border-radius: 999px;
    background: var(--soft);
    color: var(--muted);
    cursor: pointer;
    font-size: 12.5px;
    transition:
      background-color var(--dur-1) var(--ease),
      color var(--dur-1) var(--ease);
  }

  .nav-chip.current {
    background: var(--soft-2);
    color: var(--fg);
  }

  .nav-count {
    color: var(--muted);
  }
}

.logo {
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 1;
}
</style>
