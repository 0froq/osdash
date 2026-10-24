<script setup lang="ts">
import geistMono from '@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?url'
import geist from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url'
import instrumentSerif from '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2?url'

const { locale, locales } = useI18n()
const lang = computed(() => locales.value.find(item => item.code === locale.value)?.language)

useHead({
  link: [geist, geistMono, instrumentSerif].map(href => ({
    rel: 'preload',
    as: 'font',
    type: 'font/woff2',
    crossorigin: 'anonymous',
    href,
  })),
  htmlAttrs: {
    lang,
  },
  titleTemplate: (title) => {
    if (!title || title === 'froq/ui')
      return 'froq/ui'
    return `${title} — froq/ui`
  },
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
