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
if (!page.value)
  throw createError({ statusCode: 404, statusMessage: 'Not found', fatal: true })

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
      <DocBody class="l-body">
        <ContentRenderer
          :value="page"
          class="l-md"
        />
      </DocBody>
    </section>
  </div>
</template>

<style scoped>
.l-sheet {
  position: relative;
  z-index: 0;
}

.l-section {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: var(--gap);
  align-items: start;
  padding: clamp(48px, 8vh, 96px) var(--pad) 0;
}

.l-body {
  grid-column: span var(--span-body);
}

@media (max-width: 860px) {
  .l-section {
    grid-template-columns: 1fr;
  }

  .l-body {
    grid-column: 1 / -1;
  }
}
</style>
