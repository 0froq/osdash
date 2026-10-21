<script setup lang="ts">
import { copy } from '~/copy/zh-CN'

defineProps<{
  title: string
  count: number
  layout: 'mine' | 'activity' | 'waiting' | 'ended'
  collapsible?: boolean
  empty?: string
}>()
</script>

<template>
  <section
    class="section"
    :data-layout="layout"
  >
    <details
      v-if="collapsible"
      class="section-details"
    >
      <summary class="section-title">{{ title }} {{ count }}</summary>
      <div class="section-body">
        <slot />
        <p
          v-if="count === 0"
          class="empty-state"
          >{{ empty || copy.emptySection }}</p
        >
      </div>
    </details>
    <template v-else>
      <h2 class="section-title">
        {{ title }}
        <span class="section-count">{{ count }}</span>
      </h2>
      <div class="section-body">
        <slot />
        <p
          v-if="count === 0"
          class="empty-state"
          >{{ empty || copy.emptySection }}</p
        >
      </div>
    </template>
  </section>
</template>
