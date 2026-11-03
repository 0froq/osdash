<script setup lang="ts">
import type { BreadcrumbLinkProps, NavigationItem } from '../../vue'
import { computed } from 'vue'

const props = defineProps<{
  label: string
  items: NavigationItem[]
  current?: string
}>()
defineSlots<{
  link?: (scope: { item: NavigationItem; props: BreadcrumbLinkProps }) => unknown
}>()
const currentValue = computed(() => props.current ?? props.items.at(-1)?.value)
function linkProps(item: NavigationItem): BreadcrumbLinkProps {
  return {
    'class': 'ui-breadcrumb-link',
    'href': item.href ?? '',
    'aria-current': item.value === currentValue.value ? 'page' : undefined,
  }
}
</script>

<template>
  <nav
    class="ui-breadcrumb"
    :aria-label="label"
  >
    <ol
      class="ui-breadcrumb-list"
      role="list"
    >
      <li
        v-for="(item, index) in items"
        :key="item.value"
        class="ui-breadcrumb-item"
      >
        <span
          v-if="index"
          class="ui-breadcrumb-separator"
          aria-hidden="true"
          >/</span
        >
        <slot
          v-if="item.href"
          name="link"
          :item="item"
          :props="linkProps(item)"
        >
          <a v-bind="linkProps(item)">{{ item.label }}</a>
        </slot>
        <span
          v-else
          class="ui-breadcrumb-text"
          :aria-current="item.value === currentValue ? 'page' : undefined"
          >{{ item.label }}</span
        >
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.ui-breadcrumb {
  color: var(--ui-muted);
  font-family: var(--ui-font-text);
  font-size: 14px;
  line-height: 1.5;
}

.ui-breadcrumb-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ui-breadcrumb-item {
  display: inline-flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  overflow-wrap: anywhere;
}

:deep(.ui-breadcrumb-link) {
  color: inherit;
  text-decoration: none;
}

:deep(.ui-breadcrumb-link:hover),
.ui-breadcrumb :deep([aria-current]) {
  color: var(--ui-fg);
}

.ui-breadcrumb-separator {
  margin-inline-start: 4px;
  color: var(--ui-line);
}

:deep(.ui-breadcrumb-link:focus-visible) {
  outline: 1px solid var(--ui-accent);
  outline-offset: 3px;
}
</style>
