<script setup lang="ts">
import type { UnitCategory } from '#shared/unit'
import type { InboxViewer } from '~/composables/useInbox'
import type { InboxViewName } from '~/components/inbox/Sidebar.vue'
import { copy } from '~/copy/zh-CN'
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
      />
    </div>
    <nav
      class="chip-row"
      :aria-label="copy.nav.home"
    >
      <button
        class="nav-chip"
        :class="{ current: view === 'home' && !category }"
        type="button"
        @click="emit('view', 'home')"
      >
        {{ copy.nav.home }}
        <span class="chip-count">{{ homeCount }}</span>
      </button>
      <button
        class="nav-chip"
        :class="{ current: view === 'later' }"
        type="button"
        @click="emit('view', 'later')"
      >
        {{ copy.nav.later }}
        <span class="chip-count">{{ laterCount }}</span>
      </button>
      <button
        class="nav-chip"
        :class="{ current: view === 'starred' }"
        type="button"
        @click="emit('view', 'starred')"
      >
        {{ copy.nav.starred }}
        <span class="chip-count">{{ starredCount }}</span>
      </button>
      <button
        v-for="item in categories"
        :key="item"
        class="nav-chip"
        :class="{ current: category === item }"
        type="button"
        @click="emit('category', item)"
      >
        {{ categoryLabel(item) }}
        <span class="chip-count">{{ categoryCounts[item] }}</span>
      </button>
      <button
        class="nav-chip"
        :class="{ current: view === 'ended' }"
        type="button"
        @click="emit('view', 'ended')"
      >
        {{ copy.sections.ended }}
        <span class="chip-count">{{ endedCount }}</span>
      </button>
    </nav>
  </header>
</template>
