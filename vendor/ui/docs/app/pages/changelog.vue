<script setup lang="ts">
import { Sidebar as UiSidebar } from '@froq/ui'

const { t, locale } = useI18n()
const contentPath = useContentPath()

const { data: releases } = await useAsyncData(
  () => `changelog-${locale.value}`,
  () =>
    queryCollection('changelog')
      .where('path', 'LIKE', `${contentPath('/changelog')}/%`)
      .order('date', 'DESC')
      .all(),
)

useCollectionIndexOgImage(
  {
    collection: 'changelog',
    path: contentPath('/changelog'),
  },
  {
    title: () => t('changelog.title'),
    description: () => t('changelog.lede'),
  },
)

const link = useSiteLink()
const current = useSidebarCurrent()
</script>

<template>
  <SectionLayout>
    <template #nav>
      <UiSidebar
        :groups="
          (releases ?? []).map(release => ({
            items: toSidebarItems([{ label: release.version, to: `#${release.version}` }], link),
          }))
        "
        :current="current"
      >
        <template #link="{ item, props: linkProps }">
          <NuxtLink
            v-bind="routerLinkProps(linkProps)"
            :to="item.href!"
          >
            {{ item.label }}
          </NuxtLink>
        </template>
      </UiSidebar>
    </template>
    <template #head>
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
    <DocPage>
      <DocSection
        v-for="(release, index) in releases"
        :id="release.version"
        :key="release.path"
        :title="release.title"
        :kicker="`${release.date}${index === 0 ? ` · ${t('changelog.latest')}` : ''}`"
      >
        <DocBody :value="release" />
      </DocSection>
    </DocPage>
  </SectionLayout>
</template>
