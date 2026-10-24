<script setup lang="ts">
import type { Contribution } from '~/demo/contrib'

defineProps<{ items: Contribution[]; active: string }>()
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
          v-for="item in items"
          :key="item.id"
          class="x-side-row"
          :class="[`turn-${item.turn}`, { selected: item.id === active }]"
          type="button"
          @click="emit('select', item.id)"
        >
          <span class="x-side-meta">{{ item.repo }} #{{ item.primary.number }}</span>
          <span class="x-side-now">{{ item.now.text }}</span>
        </button>
      </nav>
      <div class="x-desktop-main">
        <slot />
      </div>
    </div>
    <figcaption>Desktop · 1280</figcaption>
  </figure>
</template>
