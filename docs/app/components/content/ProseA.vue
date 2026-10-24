<script setup lang="ts">
const props = defineProps<{
  href?: string
  target?: string
}>()

const link = useSiteLink()
const external = computed(() => {
  const href = props.href ?? ''
  return href.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(href)
})
const to = computed(() => {
  const href = props.href ?? ''
  if (!href || external.value || href.startsWith('#'))
    return href
  return link(href)
})
</script>

<template>
  <a
    v-if="external"
    :href="href"
    :target="target"
  >
    <slot />
  </a>
  <NuxtLink
    v-else
    :to="to"
  >
    <slot />
  </NuxtLink>
</template>
