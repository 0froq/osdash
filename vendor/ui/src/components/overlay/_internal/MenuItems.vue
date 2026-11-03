<script setup lang="ts">
import type { MenuItem } from '../../../vue'
import {
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from 'reka-ui'
import { computed } from 'vue'
import MenuItems from './MenuItems.vue'

const props = withDefaults(
  defineProps<{
    items: MenuItem[]
    portalTo?: string | HTMLElement
    kind?: 'dropdown' | 'context'
  }>(),
  { kind: 'dropdown' },
)
const emit = defineEmits<{ select: [item: MenuItem, event: Event] }>()
defineSlots<{ item?: (scope: { item: MenuItem }) => unknown }>()
const parts = computed(() =>
  props.kind === 'context'
    ? {
        item: ContextMenuItem,
        portal: ContextMenuPortal,
        separator: ContextMenuSeparator,
        sub: ContextMenuSub,
        subContent: ContextMenuSubContent,
        subTrigger: ContextMenuSubTrigger,
      }
    : {
        item: DropdownMenuItem,
        portal: DropdownMenuPortal,
        separator: DropdownMenuSeparator,
        sub: DropdownMenuSub,
        subContent: DropdownMenuSubContent,
        subTrigger: DropdownMenuSubTrigger,
      },
)
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
          >›</span
        >
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

<style scoped>
/*Floating lists share one control-tier surface: hairline, square, no soft elevation.*/
.ui-menu-content {
  box-sizing: border-box;
  z-index: 1001;
  min-width: min(9.5rem, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  max-height: calc(100dvh - 24px);
  padding: 4px 0;
  overflow-y: auto;
  border: 1px solid var(--ui-line);
  border-radius: 0;
  background: var(--ui-bg);
  box-shadow: none;
  color: var(--ui-fg);
  font: 11px/1.3 var(--ui-font-meta);
  outline: none;
}

.ui-menu-sub-content {
  z-index: 1002;
}

.ui-menu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 24px;
  padding-block: 8px;
  padding-inline: 36px 16px;
  border-radius: 0;
  cursor: default;
  outline: none;
  user-select: none;
  overflow-wrap: anywhere;
}

.ui-menu-item[data-highlighted] {
  background: none;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
}

.ui-menu-item[aria-current='page']::before,
.ui-menu-item :deep([aria-current='page']::before) {
  content: '';
  position: absolute;
  top: 50%;
  inset-inline-start: 16px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ui-accent);
  transform: translateY(-50%);
}

.ui-menu-item[data-disabled] {
  color: var(--ui-muted);
  opacity: 0.6;
}

.ui-menu-label {
  flex: 1;
  min-width: 0;
}

.ui-menu-chevron {
  color: var(--ui-muted);
}

.ui-menu-content[dir='rtl'] .ui-menu-chevron {
  transform: rotate(180deg);
}

.ui-menu-separator {
  height: 1px;
  margin: 4px 16px;
  background: var(--ui-line);
}
</style>
