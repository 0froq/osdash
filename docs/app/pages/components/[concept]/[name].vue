<script setup lang="ts">
const { t } = useI18n()
const link = useSiteLink()
const { concept, item } = useComponentRoute()
const { docFor } = await useComponentDocs()
const doc = computed(() => concept.value && item.value ? docFor(concept.value.id, item.value.name) : undefined)

if (!concept.value || !item.value)
  throw createError({ statusCode: 404, statusMessage: 'Not found', fatal: true })

const hasApi = computed(() => Boolean(doc.value?.model || doc.value?.props?.length || doc.value?.slots?.length || doc.value?.events?.length))

usePaperOgImage({
  title: () => item.value?.name,
  description: () => doc.value?.description,
})
</script>

<template>
  <div
    v-if="item && concept"
    class="component-page"
  >
    <header class="component-head">
      <p class="l-kicker">
        <NuxtLink :to="link(`/components/${concept.id}`)">
          {{ concept.id }}
        </NuxtLink>
      </p>
      <h1>{{ item.name }}</h1>
      <ComponentStatus
        class="component-design-status"
        explain
      />
      <p v-if="doc?.description">
        {{ doc.description }}
      </p>
    </header>
    <DocBody v-if="doc">
      <ContentRenderer
        :value="doc"
        class="l-md"
      />
    </DocBody>
    <h2>{{ t('components.demo') }}</h2>
    <ComponentDemo :demo="item.demo" />
    <template v-if="doc && hasApi">
      <h2>{{ t('components.api') }}</h2>
      <ComponentApi :doc="doc" />
    </template>
    <template v-if="!doc">
      <h2>{{ t('components.usage') }}</h2>
      <pre class="demo-code"><code>{{ item.snippet }}</code></pre>
    </template>
  </div>
</template>

<style scoped>
.component-page > h2 {
  margin: 2.4em 0 0.6em;
  font-family: var(--ui-font-display);
  font-weight: 400;
  font-size: calc(clamp(30px, 2.8vw, 40px) * var(--title-scale));
  line-height: 1.1;
  letter-spacing: -0.015em;
}

.component-page > h2:first-child {
  margin-top: 0;
}

.l-kicker {
  margin: 0;
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-muted);
}

.component-head h1 {
  margin: 0.35em 0 0.4em;
  font-family: var(--ui-font-display);
  font-weight: 400;
  font-size: calc(clamp(36px, 4vw, 56px) * var(--title-scale));
  line-height: 1;
  letter-spacing: -0.02em;
}

.component-head p:not(.l-kicker) {
  max-width: 36rem;
  margin: 0;
  color: var(--ui-muted);
}

.component-design-status {
  margin-bottom: 16px;
}

.demo-code {
  margin: 16px 0 0;
}
</style>
