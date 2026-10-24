<script setup lang="ts">
const { t } = useI18n()
const link = useSiteLink()
const { concept } = useComponentRoute()
const { docFor } = await useComponentDocs()

if (!concept.value)
  throw createError({ statusCode: 404, statusMessage: 'Not found', fatal: true })

usePaperOgImage({
  title: () => concept.value?.id,
  description: () => concept.value?.items.map(item => item.name).join(', '),
})
</script>

<template>
  <div v-if="concept">
    <article
      v-for="entry in concept.items"
      :id="entry.id"
      :key="entry.id"
      class="component-block"
    >
      <div class="component-entry">
        <h2>
          <NuxtLink :to="link(entry.to)">
            {{ entry.name }}
          </NuxtLink>
          <ComponentStatus />
        </h2>
        <NuxtLink
          class="l-kicker"
          :to="link(entry.to)"
        >
          {{ t('components.details') }}
        </NuxtLink>
      </div>
      <p
        v-if="docFor(concept.id, entry.name)?.description"
        class="component-summary"
      >
        {{ docFor(concept.id, entry.name)?.description }}
      </p>
      <ComponentDemo :demo="entry.demo" />
    </article>
  </div>
</template>

<style scoped>
.component-block {
  scroll-margin-top: 96px;
}

.component-block + .component-block {
  margin-top: 3.2em;
}

.component-block:first-child .component-entry h2 {
  margin-top: 0;
}

.component-entry {
  display: flex;
  gap: 16px;
  align-items: baseline;
  justify-content: space-between;
}

.component-entry h2 :deep(.design-status) {
  margin-left: 12px;
}

.l-kicker {
  margin: 0;
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-muted);
}

.component-summary {
  max-width: 36rem;
  margin: 0.4em 0 0;
  color: var(--ui-muted);
}
</style>
