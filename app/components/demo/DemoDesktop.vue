<script setup lang="ts">
import { currentItem, type Story } from '~/demo/story'

defineProps<{ stories: Story[]; active: string }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <figure class="x-desktop">
    <div
      class="x-chrome"
      aria-hidden="true"
    >
      <span /><span /><span />
      <p>osdash.froq.me</p>
    </div>
    <div class="x-desktop-body">
      <nav class="x-side">
        <p class="x-side-brand">osdash</p>
        <button
          v-for="story in stories"
          :key="story.id"
          class="x-side-row"
          :class="[`turn-${story.turn}`, { selected: story.id === active }]"
          type="button"
          @click="emit('select', story.id)"
        >
          <span class="x-side-meta">{{ story.repo }} #{{ currentItem(story).number }}</span>
          <span class="x-side-now">{{ story.now }}</span>
        </button>
      </nav>
      <div class="x-desktop-main">
        <slot />
      </div>
    </div>
    <figcaption>Desktop · 1280</figcaption>
  </figure>
</template>
