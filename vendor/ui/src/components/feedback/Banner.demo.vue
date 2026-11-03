<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from 'vue'
import Button from '../button/Button.vue'
import Banner from './Banner.vue'

const visible = ref(true)
const restore = useTemplateRef<InstanceType<typeof Button>>('restore')

async function dismiss() {
  visible.value = false
  await nextTick()
  restore.value?.$el.focus()
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
  <Button
    v-else
    ref="restore"
    @click="visible = true"
  >
    Show site notice
  </Button>
  <p id="banner-reference">
    A persistent site-wide notice, with caller-owned actions and optional dismissal.
  </p>
</template>
