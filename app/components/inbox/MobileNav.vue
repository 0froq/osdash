<script setup lang="ts">
import type { InboxCounts, InboxViewer } from '~/composables/useInbox'
import { copy } from '~/copy/zh-CN'
import { categoryLabel } from '~/utils/category'
import type { UnitCategory } from '#shared/unit'

defineProps<{
  counts: InboxCounts
  viewer: InboxViewer
  pending: boolean
}>()

const emit = defineEmits<{
  refresh: []
  logout: []
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
      <span class="nav-chip current">
        {{ copy.nav.home }}
        <span class="chip-count">{{ counts.mine }}</span>
      </span>
      <span class="nav-chip">
        {{ copy.nav.later }}
        <span
          v-if="counts.later"
          class="chip-count"
          >{{ counts.later }}</span
        >
      </span>
      <span class="nav-chip">
        {{ copy.nav.starred }}
        <span
          v-if="counts.starred"
          class="chip-count"
          >{{ counts.starred }}</span
        >
      </span>
      <span
        v-for="category in categories"
        :key="category"
        class="nav-chip"
      >
        {{ categoryLabel(category) }}
        <span class="chip-count">{{ counts.byCategory[category] }}</span>
      </span>
      <span class="nav-chip">
        {{ copy.sections.ended }}
        <span class="chip-count">{{ counts.ended }}</span>
      </span>
    </nav>
  </header>
</template>
