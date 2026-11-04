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
          class="ui ui-menu-content ui-menu-sub-content"
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
.ui-menu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-block: 6px;
  padding-inline: 10px;
  border-radius: 0;
  color: var(--ui-muted);
  cursor: pointer;
  outline: none;
  user-select: none;
  animation: ui-menu-item-in calc(var(--ui-dur) * 0.9) var(--ui-ease) calc(var(--ui-dur) * 0.35)
    backwards;
  transition:
    color var(--ui-dur) var(--ui-ease),
    background-color var(--ui-dur) var(--ui-ease);
}

/* Rows appear one beat after the frame unfolds, like text settling in. */
@keyframes ui-menu-item-in {
  from {
    opacity: 0;
    translate: 0 -2px;
  }
}

.ui-menu-item[data-highlighted] {
  background: color-mix(in srgb, var(--ui-fg) 6%, transparent);
  color: var(--ui-fg);
}

.ui-menu-item[aria-current='page'],
.ui-menu-item :deep([aria-current='page']) {
  color: var(--ui-fg);
}

/* Current: the 3px accent capsule at the leading edge, same as Sidebar. */
.ui-menu-item[aria-current='page']::before,
.ui-menu-item :deep([aria-current='page']::before) {
  content: '';
  position: absolute;
  top: 50%;
  inset-inline-start: 0;
  width: 3px;
  height: 10px;
  border-radius: 1px;
  background: var(--ui-accent);
  transform: translate(-30%, -50%);
}

.ui-menu-item[data-disabled] {
  opacity: 0.5;
  cursor: default;
}

.ui-menu-label {
  flex: 1;
  min-width: 0;
}

.ui-menu-chevron {
  color: var(--ui-faint);
  transition: color var(--ui-dur) var(--ui-ease);
}

.ui-menu-item[data-highlighted] .ui-menu-chevron {
  color: var(--ui-fg);
}

.ui-menu-separator {
  height: 1px;
  margin: 4px 0;
  background: var(--ui-line);
}

@media (prefers-reduced-motion: reduce) {
  .ui-menu-item {
    animation: none;
  }
}
</style>

<!-- The sub-content surface teleports past this scope; its chrome is global. -->
<style>
.ui-menu-content[dir='rtl'] .ui-menu-chevron {
  transform: rotate(180deg);
}
</style>
