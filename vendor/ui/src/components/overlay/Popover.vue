<script setup lang="ts">
import { PopoverAnchor, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { useSlots, useTemplateRef } from 'vue'
import { usePortalTarget } from '../../vue'

defineOptions({ inheritAttrs: false })
withDefaults(defineProps<{
  label: string
  closeLabel: string
  triggerLabel?: string
  disabled?: boolean
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  portalTo?: string | HTMLElement
  reference?: HTMLElement
}>(), { disabled: false, side: 'bottom', align: 'start', sideOffset: 8 })
defineSlots<{
  trigger?: () => unknown
  default?: (scope: { close: () => void }) => unknown
}>()
const model = defineModel<boolean>({ default: false })
const slots = useSlots()
const scope = useTemplateRef<HTMLElement>('scope')
const target = usePortalTarget(scope)
function close() {
  model.value = false
}
</script>

<template>
  <div
    ref="scope"
    class="ui-overlay-scope"
  >
    <PopoverRoot v-model:open="model">
      <PopoverAnchor
        v-if="reference"
        :reference="reference"
        as="span"
        hidden
      />
      <PopoverTrigger
        v-else
        :as-child="Boolean(slots.trigger)"
        :disabled="disabled"
        class="ui-overlay-trigger"
      >
        <slot name="trigger">
          {{ triggerLabel ?? label }}
        </slot>
      </PopoverTrigger>
      <PopoverPortal
        :to="portalTo ?? target"
        :disabled="!portalTo && !target"
      >
        <PopoverContent
          v-bind="$attrs"
          class="ui-popover-content"
          :aria-label="label"
          :side="side"
          :align="align"
          :side-offset="sideOffset"
          :collision-padding="12"
        >
          <PopoverClose
            class="ui-overlay-close"
            :aria-label="closeLabel"
          >
            <span aria-hidden="true">×</span>
          </PopoverClose>
          <slot :close="close" />
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </div>
</template>
