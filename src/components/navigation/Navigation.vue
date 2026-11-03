<script setup lang="ts">
import type { NavigationItem, NavigationLinkProps } from '../../vue'
import { useNavigation } from '../../vue'

const props = withDefaults(
  defineProps<{
    items: NavigationItem[]
    current?: 'page' | 'location'
  }>(),
  { current: 'page' },
)
defineSlots<{
  link?: (scope: { item: NavigationItem; props: NavigationLinkProps }) => unknown
}>()
const model = defineModel<string>({ default: '' })
const { isActive, activate } = useNavigation(model)

function linkProps(item: NavigationItem): NavigationLinkProps {
  return {
    'class': 'ui-navigation-link',
    'href': item.href ?? '#',
    'aria-current': isActive(item) ? props.current : undefined,
    'onClick': event => activate(event, item),
  }
}
</script>

<template>
  <nav class="ui-navigation">
    <template
      v-for="item in items"
      :key="item.value"
    >
      <slot
        name="link"
        :item="item"
        :props="linkProps(item)"
      >
        <a v-bind="linkProps(item)">{{ item.label }}</a>
      </slot>
    </template>
  </nav>
</template>

<style scoped>
.ui-navigation {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 28px;
  font-family: var(--ui-font-text);
  font-size: 0.875rem;
}

:deep(.ui-navigation-link) {
  color: var(--ui-muted);
  text-decoration: none;
  transition: color var(--ui-dur) var(--ui-ease);
}

:deep(.ui-navigation-link:hover),
:deep(.ui-navigation-link[aria-current]) {
  color: var(--ui-fg);
}

:deep(.ui-navigation-link:focus-visible) {
  outline: 1px solid var(--ui-accent);
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.ui-navigation-link) {
    transition: none;
  }
}
</style>
