<script setup lang="ts">
const { t, locale } = useI18n()
const contentPath = useContentPath()

const { data: releases } = await useAsyncData(
  () => `changelog-${locale.value}`,
  () => queryCollection('changelog').where('path', 'LIKE', `${contentPath('/changelog')}/%`).order('date', 'DESC').all(),
)

useCollectionIndexOgImage({
  collection: 'changelog',
  path: contentPath('/changelog'),
}, {
  title: () => t('changelog.title'),
  description: () => t('changelog.lede'),
})
</script>

<template>
  <SectionLayout>
    <template #nav>
      <Sidebar :groups="(releases ?? []).map(release => ({ items: [{ label: release.version, to: `#${release.version}` }] }))" />
    </template>
    <template #banner>
      <PageHead
        :kicker="t('changelog.label')"
        :title="t('changelog.title')"
        :lede="t('changelog.lede')"
        long
        variant="section"
      >
        <template #meta>
          {{ t('changelog.count', { n: releases?.length ?? 0 }) }}
        </template>
      </PageHead>
    </template>
    <section
      v-for="(release, index) in releases"
      :id="release.version"
      :key="release.path"
      class="l-release"
    >
      <p class="l-kicker">
        {{ release.date }}<template v-if="index === 0">
          · {{ t('changelog.latest') }}
        </template>
      </p>
      <h2 class="l-entry-title">
        {{ release.title }}
      </h2>
      <DocBody notes>
        <ContentRenderer :value="release" />
      </DocBody>
    </section>
  </SectionLayout>
</template>

<style scoped>
.l-release {
  padding-top: clamp(36px, 6vh, 72px);
}

.l-kicker {
  margin: 0;
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-muted);
}

.l-entry-title {
  margin: 14px 0 0;
  font-family: var(--ui-font-display);
  font-weight: 400;
  font-size: calc(clamp(32px, 3.6vw, 56px) * var(--title-scale));
  line-height: 1.02;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

:lang(zh) .l-entry-title {
  letter-spacing: 0;
}
</style>
