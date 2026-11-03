<script setup lang="ts">
const { t } = useI18n()
const link = useSiteLink()
const sections = componentSections()

usePaperOgImage({
  title: () => t('components.title'),
  description: () => t('components.lede'),
})

const { docFor } = await useComponentSummaries()

function sectionLabel(id: '' | 'form' | 'prose'): string {
  return componentSectionLabel(id, t)
}
</script>

<template>
  <DocPage>
    <p class="catalog-design-status">
      {{ t('components.statusGate') }}
    </p>
    <DocSection
      v-for="section in sections"
      :key="section.id || 'rest'"
      :title="section.id ? sectionLabel(section.id) : ''"
    >
      <article
        v-for="group in section.concepts"
        :key="group.id"
        class="home-concept"
      >
        <h3>
          <NuxtLink :to="link(`/components/${group.id}`)">
            {{ group.id }}
          </NuxtLink>
        </h3>
        <p
          v-for="entry in group.items"
          :key="entry.id"
          class="component-summary"
        >
          <NuxtLink :to="link(entry.to)">
            {{ entry.name }}
          </NuxtLink>
          <ComponentStatus :status="docFor(group.id, entry.name)?.designStatus" />
          <template v-if="docFor(group.id, entry.name)?.description">
            {{ docFor(group.id, entry.name)?.description }}
          </template>
        </p>
      </article>
    </DocSection>
  </DocPage>
</template>

<style scoped>
.catalog-design-status {
  max-width: 38rem;
  margin: 0 0 24px;
  color: var(--ui-muted);
  font-size: 13px;
}

.home-concept + .home-concept {
  margin-top: 1.6em;
}

.home-concept h3 {
  margin: 0 0 0.2em;
  font-size: 17px;
  font-weight: 500;
}

.component-summary {
  max-width: 36rem;
  margin: 0.4em 0 0;
  color: var(--ui-muted);
}

.component-summary a {
  margin-right: 0.7em;
  color: var(--ui-fg);
}

.component-summary :deep(.design-status) {
  margin-right: 0.7em;
}
</style>
