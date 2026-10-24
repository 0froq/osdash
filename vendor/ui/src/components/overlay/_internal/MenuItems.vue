<script setup lang="ts">
import type { MenuItem } from '../../../vue'
import { ContextMenuItem, ContextMenuPortal, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from 'reka-ui'
import { computed } from 'vue'
import MenuItems from './MenuItems.vue'

const props = withDefaults(defineProps<{ items: MenuItem[], portalTo?: string | HTMLElement, kind?: 'dropdown' | 'context' }>(), { kind: 'dropdown' })
const emit = defineEmits<{ select: [item: MenuItem, event: Event] }>()
defineSlots<{ item?: (scope: { item: MenuItem }) => unknown }>()
const parts = computed(() => props.kind === 'context'
  ? { item: ContextMenuItem, portal: ContextMenuPortal, separator: ContextMenuSeparator, sub: ContextMenuSub, subContent: ContextMenuSubContent, subTrigger: ContextMenuSubTrigger }
  : { item: DropdownMenuItem, portal: DropdownMenuPortal, separator: DropdownMenuSeparator, sub: DropdownMenuSub, subContent: DropdownMenuSubContent, subTrigger: DropdownMenuSubTrigger })
</script>

<template>
  <template
    v-for="(item, index) in items"
    :key="item.value"
  >
    <component
      :is="parts.separator"
      v-if="item.separatorBefore && index > 0"
      class="ui-menu-separator"
    />
    <component
      :is="parts.sub"
      v-if="item.children?.length"
    >
      <component
        :is="parts.subTrigger"
        class="ui-menu-item ui-menu-sub-trigger"
        :disabled="item.disabled"
        :text-value="item.label"
      >
        <span class="ui-menu-label">
          <slot
            name="item"
            :item="item"
          >
            {{ item.label }}
          </slot>
        </span>
        <span
          class="ui-menu-chevron"
          aria-hidden="true"
        >›</span>
      </component>
      <component
        :is="parts.portal"
        :to="portalTo"
        :disabled="!portalTo"
      >
        <component
          :is="parts.subContent"
          class="ui-menu-content ui-menu-sub-content"
          :aria-label="item.label"
          :side-offset="4"
          :collision-padding="12"
        >
          <MenuItems
            :items="item.children"
            :kind="kind"
            :portal-to="portalTo"
            @select="(child, event) => emit('select', child, event)"
          >
            <template #item="{ item: child }">
              <slot
                name="item"
                :item="child"
              >
                {{ child.label }}
              </slot>
            </template>
          </MenuItems>
        </component>
      </component>
    </component>
    <component
      :is="parts.item"
      v-else
      class="ui-menu-item"
      :disabled="item.disabled"
      :text-value="item.label"
      @select="emit('select', item, $event)"
    >
      <slot
        name="item"
        :item="item"
      >
        {{ item.label }}
      </slot>
    </component>
  </template>
</template>
