<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from 'vue'
import Banner from './Banner.vue'

const visible = ref(true)
const restore = useTemplateRef<HTMLButtonElement>('restore')

async function dismiss() {
  visible.value = false
  await nextTick()
  restore.value?.focus()
}
</script>

<template>
  <Banner
    v-if="visible"
    label="Site notice"
    dismiss-label="Dismiss site notice"
    @dismiss="dismiss"
  >
    This site is a work in progress. Components are AI drafts awaiting design review.
    <template #actions>
      <a href="#banner-reference">About this banner</a>
    </template>
  </Banner>
  <button
    v-else
    ref="restore"
    class="ui-button"
    type="button"
    @click="visible = true"
  >
    Show site notice
  </button>
  <p id="banner-reference">
    A persistent site-wide notice, with caller-owned actions and optional dismissal.
  </p>
</template>
