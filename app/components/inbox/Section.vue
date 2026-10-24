<script setup lang="ts">
import { copy } from '~/copy/en'

const props = defineProps<{
  title: string
  count: number
  layout: 'mine' | 'activity' | 'waiting' | 'ended'
  collapsible?: boolean
  empty?: string
}>()

const open = ref(!props.collapsible)
const bodyId = useId()
</script>

<template>
  <section
    class="section"
    :data-layout="layout"
  >
    <button
      v-if="collapsible"
      class="section-head section-toggle"
      type="button"
      :aria-expanded="open"
      :aria-controls="bodyId"
      @click="open = !open"
    >
      <svg
        class="section-chevron"
        :class="{ open }"
        viewBox="0 0 12 12"
        aria-hidden="true"
      >
        <path
          d="M4.5 2.5 8 6l-3.5 3.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="section-title">{{ title }}</span>
      <span class="section-count">{{ count }}</span>
    </button>
    <h2
      v-else
      class="section-head"
    >
      <span class="section-title">{{ title }}</span>
      <span class="section-count">{{ count }}</span>
    </h2>
    <div
      :id="bodyId"
      class="section-panel"
      :class="{ collapsed: !open }"
    >
      <div
        class="section-inner"
        :inert="!open"
      >
        <div class="section-body">
          <slot />
          <p
            v-if="count === 0"
            class="empty-state"
            >{{ empty || copy.emptySection }}</p
          >
        </div>
      </div>
    </div>
  </section>
</template>
