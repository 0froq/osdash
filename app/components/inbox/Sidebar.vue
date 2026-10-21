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
  <aside class="sidebar">
    <p class="logo">{{ copy.brand }}</p>
    <nav
      class="side-nav"
      :aria-label="copy.nav.home"
    >
      <p class="side-link current">
        <span>{{ copy.nav.home }}</span>
        <span class="side-count">{{ counts.mine }}</span>
      </p>
      <p class="side-link">
        <span>{{ copy.nav.later }}</span>
        <span class="side-count">{{ counts.later }}</span>
      </p>
      <p class="side-link">
        <span>{{ copy.nav.starred }}</span>
        <span class="side-count">{{ counts.starred }}</span>
      </p>
      <hr class="side-rule" />
      <p
        v-for="category in categories"
        :key="category"
        class="side-link"
      >
        <span>{{ categoryLabel(category) }}</span>
        <span class="side-count">{{ counts.byCategory[category] }}</span>
      </p>
      <p class="side-link">
        <span>{{ copy.sections.ended }}</span>
        <span class="side-count">{{ counts.ended }}</span>
      </p>
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
