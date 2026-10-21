<script setup lang="ts">
import type { UnitCategory } from '#shared/unit'
import type { InboxViewer } from '~/composables/useInbox'
import { copy } from '~/copy/zh-CN'
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
      <hr class="side-rule" />
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
      <button
        class="side-link"
        :class="{ current: view === 'ended' }"
        type="button"
        @click="emit('view', 'ended')"
      >
        <span>{{ copy.sections.ended }}</span>
        <span class="side-count">{{ endedCount }}</span>
      </button>
    </nav>
    <SidebarMenu
      :name="viewer.name || viewer.login"
      :avatar-url="viewer.avatarUrl"
      :pending="pending"
      @refresh="emit('refresh')"
      @logout="emit('logout')"
    />
  </aside>
</template>
