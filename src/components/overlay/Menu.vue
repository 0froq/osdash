<script setup lang="ts">
import type { MenuItem } from '../../vue'
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
import { useSlots, useTemplateRef } from 'vue'
import { usePortalTarget } from '../../vue'
import MenuItems from './_internal/MenuItems.vue'

defineOptions({ inheritAttrs: false })
withDefaults(
  defineProps<{
    label: string
    items: MenuItem[]
    disabled?: boolean
    modal?: boolean
    dir?: 'ltr' | 'rtl'
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
    sideOffset?: number
    portalTo?: string | HTMLElement
  }>(),
  { disabled: false, modal: true, side: 'bottom', align: 'start', sideOffset: 8 },
)
const emit = defineEmits<{ select: [item: MenuItem, event: Event] }>()
defineSlots<{
  trigger?: () => unknown
  item?: (scope: { item: MenuItem }) => unknown
}>()
const model = defineModel<boolean>({ default: false })
const slots = useSlots()
const scope = useTemplateRef<HTMLElement>('scope')
const target = usePortalTarget(scope)
</script>

<template>
  <div
    ref="scope"
    class="ui-overlay-scope"
  >
    <DropdownMenuRoot
      v-model:open="model"
      :modal="modal"
      :dir="dir"
    >
      <DropdownMenuTrigger
        :as-child="Boolean(slots.trigger)"
        :disabled="disabled"
        class="ui-overlay-trigger"
      >
        <slot name="trigger">
          {{ label }}
        </slot>
      </DropdownMenuTrigger>
      <DropdownMenuPortal
        :to="portalTo ?? target"
        :disabled="!portalTo && !target"
      >
        <DropdownMenuContent
          v-bind="$attrs"
          class="ui-menu-content"
          :aria-label="label"
          :side="side"
          :align="align"
          :side-offset="sideOffset"
          :collision-padding="12"
        >
          <MenuItems
            :items="items"
            :portal-to="portalTo ?? target"
            @select="(item, event) => emit('select', item, event)"
          >
            <template #item="{ item }">
              <slot
                name="item"
                :item="item"
              >
                {{ item.label }}
              </slot>
            </template>
          </MenuItems>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </div>
</template>

<style scoped>
.ui-overlay-scope {
  display: contents;
}

.ui-overlay-trigger {
  padding: 0 0 1px;
  border: 0;
  border-bottom: 1px solid currentColor;
  background: none;
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
  font-size: inherit;
  cursor: pointer;
}

.ui-overlay-trigger:disabled {
  color: var(--ui-muted);
  cursor: not-allowed;
}

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

.ui-overlay-trigger:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 4px;
}
</style>
