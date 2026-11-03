<script setup lang="ts">
import { Sidebar as UiSidebar } from '@froq/ui'

definePageMeta({
  key: route => {
    const parts = route.path.split('/').filter(Boolean)
    const at = parts.indexOf('docs')
    return at === -1 ? route.path : `/${parts.slice(0, at + 1).join('/')}`
  },
})

const route = useRoute()
const { site } = useAppConfig()
const { t, locale } = useI18n()

const link = useSiteLink()
const current = useSidebarCurrent()
const contentPath = useContentPath()

const rest = computed(() => {
  const slug = route.params.slug
  const parts = Array.isArray(slug) ? slug : slug ? [slug] : []
  return parts.length ? `/${parts.join('/')}` : ''
})

const { data } = await useAsyncData(
  () => `docs-${locale.value}-${rest.value}`,
  async () => {
    const root = contentPath('/docs')
    const [doc, all] = await Promise.all([
      queryCollection('docs').path(`${root}${rest.value}`).first(),
      queryCollection('docs').where('path', 'LIKE', `${root}%`).all(),
    ])
    return { doc, all, root }
  },
)
const doc = computed(() => data.value?.doc)
if (!doc.value) throw createError({ statusCode: 404, statusMessage: 'Not found', fatal: true })

function toPublic(path: string): string {
  const root = data.value?.root ?? contentPath('/docs')
  const localeRoot = root.slice(0, root.length - '/docs'.length)
  return path.startsWith(localeRoot) ? path.slice(localeRoot.length) || '/' : path
}

const titles = computed(() => {
  const map = new Map<string, string>()
  for (const item of data.value?.all ?? []) {
    if (item.title) map.set(toPublic(item.path), item.title)
  }
  return map
})

const groups = computed(() =>
  site.docs.map(group => ({
    label: t(group.label),
    items: group.items.map(to => ({
      to,
      title: titles.value.get(to) ?? to.split('/').pop() ?? to,
    })),
  })),
)

const sidebarGroups = computed(() =>
  toSidebarGroups(
    groups.value.map(group => ({
      label: group.label,
      items: group.items.map(item => ({ label: item.title, to: item.to })),
    })),
    link,
  ),
)

const pages = computed(() =>
  groups.value.flatMap(group =>
    group.items.map(item => ({
      ...item,
      group: group.label,
    })),
  ),
)
const herePath = computed(() => (doc.value ? toPublic(doc.value.path) : ''))
const indexDoc = computed(() =>
  (data.value?.all ?? []).find(item => toPublic(item.path) === '/docs'),
)
const indexEntry = computed(() => pages.value.find(item => item.to === '/docs'))
const index = computed(() => pages.value.findIndex(item => item.to === herePath.value))
const prev = computed(() => pages.value[index.value - 1])
const next = computed(() => pages.value[index.value + 1])

useContentOgImage(doc, 'docs', {
  title: () => doc.value?.title,
  description: () => doc.value?.description,
  type: 'article',
})
</script>

<template>
  <SectionLayout :head="!rest">
    <template #nav>
      <UiSidebar
        :groups="sidebarGroups"
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
        v-if="indexDoc"
        :title="indexDoc.title"
        :lede="indexDoc.description"
        long
        variant="section"
      >
        <template #kicker>
          <NuxtLink :to="link('/docs')">
            {{ t('docs.label') }}
          </NuxtLink>
          <template v-if="indexEntry"> / {{ indexEntry.group }} </template>
        </template>
      </PageHead>
    </template>
    <DocPage
      v-if="doc"
      :title="rest ? doc.title : undefined"
      :lede="rest ? doc.description : undefined"
      :kicker="rest ? doc.kicker : undefined"
      :value="doc"
    >
      <template #footer>
        <nav
          v-if="prev || next"
          class="l-section is-pager"
        >
          <p class="l-label">
            <NuxtLink
              v-if="prev"
              :to="link(prev.to)"
            >
              ← {{ prev.title }}
            </NuxtLink>
          </p>
          <NuxtLink
            v-if="next"
            class="l-body l-entry"
            :to="link(next.to)"
          >
            <span class="l-kicker">{{ t('docs.next') }}</span>
            <span class="l-entry-title">{{ next.title }}</span>
          </NuxtLink>
        </nav>
      </template>
    </DocPage>
  </SectionLayout>
</template>

<style scoped>
.l-section {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: var(--gap);
  align-items: baseline;
  padding-bottom: clamp(48px, 8vh, 96px);
}

.l-label {
  grid-column: span var(--span-margin);
  margin: 0;
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-muted);
}

.l-label a {
  transition: color 0.3s;
}

.l-label a:hover {
  color: var(--ui-fg);
}

.l-entry {
  grid-column: span var(--span-body);
  display: grid;
  gap: 10px;
  padding-top: 18px;
  border-top: 1px solid var(--ui-line);
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
  margin: 0;
  font-family: var(--ui-font-display);
  font-weight: 400;
  font-size: calc(clamp(32px, 3.6vw, 56px) * var(--title-scale));
  line-height: 1.02;
  letter-spacing: -0.02em;
  text-wrap: balance;
  transition: color 0.3s;
}

:is(:lang(zh), :lang(ja)) .l-entry-title {
  letter-spacing: 0;
}

.l-entry:hover .l-entry-title {
  color: var(--ui-muted);
}

@media (max-width: 860px) {
  .l-section {
    grid-template-columns: 1fr;
  }

  .l-label,
  .l-entry {
    grid-column: 1 / -1;
    justify-self: start;
  }
}
</style>
