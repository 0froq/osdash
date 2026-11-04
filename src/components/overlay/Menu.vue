<script setup lang="ts">
import type { MenuItem } from '../../vue'
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
import { useTemplateRef } from 'vue'
import { usePortalTarget } from '../../vue'
import Button from '../button/Button.vue'
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
  { disabled: false, modal: true, side: 'bottom', align: 'start', sideOffset: 4 },
)
const emit = defineEmits<{ select: [item: MenuItem, event: Event] }>()
defineSlots<{
  trigger?: () => unknown
  item?: (scope: { item: MenuItem }) => unknown
}>()
const model = defineModel<boolean>({ default: false })
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
        as-child
        :disabled="disabled"
      >
        <slot name="trigger">
          <Button :disabled="disabled">{{ label }}</Button>
        </slot>
      </DropdownMenuTrigger>
      <DropdownMenuPortal
        :to="portalTo ?? target"
        :disabled="!portalTo && !target"
      >
        <DropdownMenuContent
          v-bind="$attrs"
          class="ui ui-menu-content"
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
</style>

<!-- The menu surface teleports past the component scope, so its chrome is global. -->
<style>
.ui-menu-content {
  box-sizing: border-box;
  z-index: 1001;
  min-width: min(9.5rem, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  max-height: calc(100dvh - 24px);
  padding: 4px 0;
  overflow-y: auto;
  border: 0;
  border-radius: 0;
  background: var(--ui-bg);
  box-shadow: 0 0 0 1px var(--ui-line);
  color: var(--ui-fg);
  font: 12px/1.4 var(--ui-font-meta);
  outline: none;
}

.ui-menu-sub-content {
  z-index: 1002;
}
</style>
