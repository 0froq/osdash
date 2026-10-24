<script setup lang="ts">
const { t } = useI18n()
const link = useSiteLink()
const sections = componentSections()

usePaperOgImage({
  title: () => t('components.title'),
  description: () => t('components.lede'),
})

const { docFor } = await useComponentDocs()

function sectionLabel(id: '' | 'form' | 'prose'): string {
  return componentSectionLabel(id, t)
}
</script>

<template>
  <div>
    <ComponentStatus
      class="catalog-design-status"
      explain
    />
    <section
      v-for="section in sections"
      :key="section.id || 'rest'"
      class="component-block"
    >
      <h2 v-if="section.id">
        {{ sectionLabel(section.id) }}
      </h2>
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
          <ComponentStatus />
          <template v-if="docFor(group.id, entry.name)?.description">
            {{ docFor(group.id, entry.name)?.description }}
          </template>
        </p>
      </article>
    </section>
  </div>
</template>

<style scoped>
.catalog-design-status {
  margin-bottom: 24px;
}

.component-block {
  scroll-margin-top: 96px;
}

.component-block + .component-block {
  margin-top: 3.2em;
}

.home-concept + .home-concept {
  margin-top: 1.6em;
}

.home-concept h3 {
  margin-bottom: 0.2em;
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
