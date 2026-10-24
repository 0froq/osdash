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
