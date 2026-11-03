<script setup lang="ts">
const { t } = useI18n()
const link = useSiteLink()
const { concept } = useComponentRoute()
const { docFor } = await useComponentSummaries()

if (!concept.value) throw createError({ statusCode: 404, statusMessage: 'Not found', fatal: true })

usePaperOgImage({
  title: () => concept.value?.id,
  description: () => concept.value?.items.map(item => item.name).join(', '),
})
</script>

<template>
  <DocPage
    v-if="concept"
    :title="concept.id"
  >
    <template #kicker>
      <NuxtLink :to="link('/components')">{{ t('components.title') }}</NuxtLink>
    </template>
    <DocSection
      v-for="entry in concept.items"
      :id="entry.id"
      :key="entry.id"
      :title="entry.name"
      :to="link(entry.to)"
      :lede="docFor(concept.id, entry.name)?.description"
    >
      <template #meta>
        <ComponentStatus :status="docFor(concept.id, entry.name)?.designStatus" />
      </template>
      <template #actions>
        <NuxtLink
          :to="link(entry.to)"
          class="entry-link"
          >{{ t('components.details') }}</NuxtLink
        >
      </template>
      <ComponentDemo :demo="entry.demo" />
    </DocSection>
  </DocPage>
</template>

<style scoped>
.entry-link {
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-muted);
}
</style>
