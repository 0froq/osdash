<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import Skeleton from '../feedback/Skeleton.vue'

const props = withDefaults(defineProps<{
  label: string
  fallback: string
  src?: string
  loading?: 'lazy' | 'eager'
}>(), { loading: 'lazy' })
const loaded = ref(false)
const failed = ref(false)
const image = useTemplateRef<HTMLImageElement>('image')
// SSR images may have finished before hydration installs their load listener.
watch(image, (element) => {
  if (element?.complete) {
    failed.value = element.naturalWidth === 0
    loaded.value = !failed.value
  }
}, { flush: 'post' })
watch(() => props.src, () => {
  loaded.value = false
  failed.value = false
})
function load(event: Event): void {
  if ((event.currentTarget as HTMLImageElement).getAttribute('src') === props.src)
    loaded.value = true
}
function error(event: Event): void {
  if ((event.currentTarget as HTMLImageElement).getAttribute('src') === props.src)
    failed.value = true
}
</script>

<template>
  <Skeleton
    class="ui-avatar"
    shape="circle"
    :loading="Boolean(src) && !loaded && !failed"
    role="img"
    :aria-label="label"
  >
    <span class="ui-avatar-body">
      <img
        v-if="src && !failed"
        :key="src"
        ref="image"
        :src="src"
        alt=""
        :loading="loading"
        decoding="async"
        @load="load"
        @error="error"
      >
      <span v-else>{{ fallback }}</span>
    </span>
  </Skeleton>
</template>
