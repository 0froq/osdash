<script setup lang="ts">
import type { MenuItem } from '../../vue'
import { DropdownMenuContent, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
import { useSlots, useTemplateRef } from 'vue'
import { usePortalTarget } from '../../vue'
import MenuItems from './_internal/MenuItems.vue'

defineOptions({ inheritAttrs: false })
withDefaults(defineProps<{
  label: string
  items: MenuItem[]
  disabled?: boolean
  modal?: boolean
  dir?: 'ltr' | 'rtl'
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  portalTo?: string | HTMLElement
  /** Draw the hairline frame around the trigger. Turn it off when the caller supplies its own control. */
  bordered?: boolean
}>(), { disabled: false, modal: true, side: 'bottom', align: 'start', sideOffset: 8, bordered: true })
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
    :class="{ 'is-bordered': bordered }"
  >
    <DropdownMenuRoot
      v-model:open="model"
      :modal="modal"
      :dir="dir"
    >
      <DropdownMenuTrigger
        :as-child="Boolean(slots.trigger)"
        :disabled="disabled"
        :class="slots.trigger ? undefined : 'ui-overlay-trigger'"
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
