<script setup lang="ts">
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { computed, useTemplateRef } from 'vue'
import { usePortalTarget } from '../../vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  text: string
  disabled?: boolean
  delayDuration?: number
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  portalTo?: string | HTMLElement
}>(), { disabled: false, delayDuration: 500, side: 'top', align: 'center', sideOffset: 8 })
defineSlots<{ default: () => unknown }>()
const model = defineModel<boolean>({ default: false })
const scope = useTemplateRef<HTMLElement>('scope')
const target = usePortalTarget(scope)
const delay = computed(() => Number.isFinite(props.delayDuration) ? Math.max(0, props.delayDuration) : 500)
</script>

<template>
  <div
    ref="scope"
    class="ui-overlay-scope"
  >
    <TooltipProvider :delay-duration="delay">
      <TooltipRoot
        v-model:open="model"
        :disabled="disabled"
      >
        <TooltipTrigger as-child>
          <slot />
        </TooltipTrigger>
        <TooltipPortal
          :to="portalTo ?? target"
          :disabled="!portalTo && !target"
        >
          <TooltipContent
            v-bind="$attrs"
            class="ui-tooltip-content"
            :aria-label="text"
            :side="side"
            :align="align"
            :side-offset="sideOffset"
            :collision-padding="12"
          >
            {{ text }}
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </TooltipProvider>
  </div>
</template>
