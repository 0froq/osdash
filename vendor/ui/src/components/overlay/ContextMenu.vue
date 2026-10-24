<script setup lang="ts">
import type { MenuItem } from '../../vue'
import { ContextMenuContent, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from 'reka-ui'
import { ref, useTemplateRef } from 'vue'
import { usePortalTarget } from '../../vue'
import ContextMenuState from './_internal/ContextMenuState.vue'
import MenuItems from './_internal/MenuItems.vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  label: string
  items: MenuItem[]
  disabled?: boolean
  modal?: boolean
  dir?: 'ltr' | 'rtl'
  portalTo?: string | HTMLElement
}>(), { disabled: false, modal: true })
const emit = defineEmits<{ select: [item: MenuItem, event: Event], openChange: [open: boolean] }>()
defineSlots<{ default: () => unknown, item?: (scope: { item: MenuItem }) => unknown }>()
const open = ref(false)
const scope = useTemplateRef<HTMLElement>('scope')
const target = usePortalTarget(scope)
const state = useTemplateRef<{ close: () => void }>('state')
function close() {
  state.value?.close()
}
defineExpose({ close })
function openChange(value: boolean) {
  open.value = value
  emit('openChange', value)
}
function keyboard(event: KeyboardEvent) {
  if (props.disabled || event.defaultPrevented || event.target !== event.currentTarget)
    return
  if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey))
    return
  event.preventDefault()
  const element = event.currentTarget as HTMLElement
  const rect = element.getBoundingClientRect()
  element.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    button: 2,
  }))
}
</script>

<template>
  <div
    ref="scope"
    class="ui-overlay-scope"
  >
    <ContextMenuRoot
      :modal="modal"
      :dir="dir"
      @update:open="openChange"
    >
      <ContextMenuState
        ref="state"
        v-slot="{ prepare }"
        :disabled="disabled"
      >
        <ContextMenuTrigger
          as="div"
          class="ui-context-menu-target"
          role="group"
          :aria-label="label"
          aria-haspopup="menu"
          :aria-expanded="open"
          :tabindex="disabled ? -1 : 0"
          :disabled="disabled"
          :style="{ WebkitTouchCallout: disabled ? 'default' : 'none' }"
          @keydown="keyboard"
          @contextmenu.capture="prepare"
          @pointerdown.capture="prepare"
        >
          <slot />
        </ContextMenuTrigger>
        <ContextMenuPortal
          :to="portalTo ?? target"
          :disabled="!portalTo && !target"
        >
          <ContextMenuContent
            v-bind="$attrs"
            class="ui-menu-content"
            :aria-label="label"
            :collision-padding="12"
          >
            <MenuItems
              kind="context"
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
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenuState>
    </ContextMenuRoot>
  </div>
</template>
