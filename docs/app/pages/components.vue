<script setup lang="ts">
definePageMeta({
  key: (route) => {
    const parts = route.path.split('/').filter(Boolean)
    const at = parts.indexOf('components')
    return at === -1 ? route.path : `/${parts.slice(0, at + 1).join('/')}`
  },
})

const { t } = useI18n()
const { conceptId } = useComponentRoute()
const home = computed(() => !conceptId.value)
const conceptCount = componentCatalog().length
const groups = computed(() => componentSections().map(section => ({
  label: section.id ? componentSectionLabel(section.id, t) : undefined,
  items: section.concepts.map(concept => ({
    label: concept.id,
    to: `/components/${concept.id}`,
    children: concept.items.map(item => ({ label: item.name, to: item.to })),
  })),
})))
</script>

<template>
  <SectionLayout :banner="home">
    <template #nav>
      <Sidebar
        :groups="groups"
        foldable
      />
    </template>
    <template #banner>
      <PageHead
        :title="t('components.title')"
        :lede="t('components.lede')"
        long
        variant="section"
      >
        <template #meta>
          {{ t('components.concepts', { n: conceptCount }) }}
        </template>
      </PageHead>
    </template>
    <NuxtPage :transition="false" />
  </SectionLayout>
</template>
