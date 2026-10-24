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
          <EmptyState
            v-if="count === 0"
            :text="empty || copy.emptySection"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  min-width: 0;
  margin-top: 44px;
}

.section-head {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin: 0;
}

.section-toggle {
  align-items: center;
  min-height: 28px;
  padding: 0;
  border: 0;
  cursor: pointer;
  text-align: left;
}

.section-title {
  color: var(--fg);
  font-size: 13px;
  font-weight: 500;
}

.section-count {
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 12px;
}

.section-chevron {
  flex: 0 0 auto;
  width: 12px;
  height: 12px;
  margin-right: -2px;
  color: var(--muted);
  transition:
    transform var(--dur-2) var(--ease),
    color var(--dur-1) var(--ease);
}

.section-chevron.open {
  transform: rotate(90deg);
}

.section-toggle:hover .section-chevron {
  color: var(--fg);
}

.section-panel {
  display: grid;
  grid-template-rows: 1fr;
  margin: 8px -12px 0;
  transition: grid-template-rows var(--dur-2) var(--ease);
}

.section-panel.collapsed {
  grid-template-rows: 0fr;
}

.section-inner {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 760px) {
  .section-panel {
    margin-right: -4px;
    margin-left: -4px;
  }

  .section-toggle {
    min-height: 36px;
  }
}
</style>
