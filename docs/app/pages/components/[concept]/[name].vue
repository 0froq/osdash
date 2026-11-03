<script setup lang="ts">
const { t } = useI18n()
const link = useSiteLink()
const { concept, item } = useComponentRoute()
const doc = await useComponentDoc(
  () => concept.value?.id,
  () => item.value?.name,
)

if (!concept.value || !item.value)
  throw createError({ statusCode: 404, statusMessage: 'Not found', fatal: true })

const hasApi = computed(() =>
  Boolean(
    doc.value?.model ||
    doc.value?.props?.length ||
    doc.value?.slots?.length ||
    doc.value?.events?.length,
  ),
)

usePaperOgImage({
  title: () => item.value?.name,
  description: () => doc.value?.description,
})
</script>

<template>
  <DocPage
    v-if="item && concept"
    :title="item.name"
    :lede="doc?.description"
    :value="doc"
  >
    <template #kicker>
      <NuxtLink :to="link(`/components/${concept.id}`)">{{ concept.id }}</NuxtLink>
    </template>
    <template #meta>
      <ComponentStatus
        :status="doc?.designStatus"
        explain
      />
    </template>
    <template #lead>
      <DocSection :title="t('components.demo')">
        <ComponentDemo :demo="item.demo" />
      </DocSection>
    </template>
    <DocSection
      v-if="doc && hasApi"
      :title="t('components.api')"
    >
      <DocBody><ComponentApi :doc="doc" /></DocBody>
    </DocSection>
    <DocSection
      v-if="!doc"
      :title="t('components.usage')"
    >
      <DocBody>
        <pre><code>{{ item.snippet }}</code></pre>
      </DocBody>
    </DocSection>
  </DocPage>
</template>
