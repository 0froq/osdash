<script setup lang="ts">
import type { NavigationItem, NavigationLinkProps } from '../../vue'
import { useNavigation } from '../../vue'

const props = withDefaults(defineProps<{
  items: NavigationItem[]
  current?: 'page' | 'location'
}>(), { current: 'page' })
defineSlots<{
  link?: (scope: { item: NavigationItem, props: NavigationLinkProps }) => unknown
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
