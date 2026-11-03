<script setup lang="ts">
const route = useRoute()
const { locale } = useI18n()
const contentPath = useContentPath()

const rest = computed(() => {
  const slug = route.params.slug
  const parts = Array.isArray(slug) ? slug : slug ? [slug] : []
  return parts.length ? `/${parts.join('/')}` : '/'
})

const { data: page } = await useAsyncData(
  () => `page-${locale.value}-${rest.value}`,
  () => queryCollection('pages').path(contentPath(rest.value)).first(),
)
if (!page.value) throw createError({ statusCode: 404, statusMessage: 'Not found', fatal: true })

useContentOgImage(page, 'pages', {
  title: () => page.value?.title,
  description: () => page.value?.description,
  type: 'article',
})
</script>

<template>
  <div
    v-if="page"
    class="l-sheet"
  >
    <PageHead
      v-if="page.head"
      long
      :kicker="page.kicker"
      :title="page.title"
      :lede="page.description"
    />
    <section class="l-section">
      <DocPage
        :title="page.head ? undefined : page.title"
        :lede="page.head ? undefined : page.description"
        :kicker="page.head ? undefined : page.kicker"
        :value="page"
      />
    </section>
  </div>
</template>

<style scoped>
.l-sheet {
  position: relative;
  z-index: 0;
}

.l-section {
  padding: clamp(48px, 8vh, 96px) var(--pad) 0;
}
</style>
