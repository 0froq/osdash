<script setup lang="ts">
import type { NavigationLinkProps } from '@froq/ui'
import { Navigation as UiNavigation } from '@froq/ui'

const { site } = useAppConfig()
const { t } = useI18n()
const { href, current } = useSectionHref()

const items = computed(() => site.nav.map(item => ({
  value: item.to,
  label: t(item.label),
  href: item.external ? item.to : href(item.to),
})))
const active = computed(() => site.nav.find(item => !item.external && current(item.to))?.to ?? '')
const isExternal = (value: string) => site.nav.some(item => item.to === value && item.external)

// Selection follows the confirmed route, not an optimistic click.
function routerLinkProps({ href: _href, onClick: _onClick, ...attrs }: NavigationLinkProps) {
  return attrs
}
</script>

<template>
  <UiNavigation
    :items="items"
    :model-value="active"
  >
    <template #link="{ item, props: linkProps }">
      <a
        v-if="isExternal(item.value)"
        :href="item.href"
        :class="linkProps.class"
      >{{ item.label }}</a>
      <NuxtLink
        v-else
        v-bind="routerLinkProps(linkProps)"
        :to="item.href!"
      >
        {{ item.label }}
      </NuxtLink>
    </template>
  </UiNavigation>
</template>
