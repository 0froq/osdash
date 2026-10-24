<script setup lang="ts">
import { ToastPortal, ToastProvider, ToastViewport } from 'reka-ui'
import { useTemplateRef } from 'vue'
import { usePortalTarget } from '../../vue'

defineOptions({ inheritAttrs: false })
withDefaults(defineProps<{
  label: string
  viewportLabel: string
  duration?: number
  hotkey?: string[]
  position?: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
  portalTo?: string | HTMLElement
}>(), { duration: 5000, hotkey: () => ['F8'], position: 'bottom-end' })
defineSlots<{ default?: () => unknown }>()
const scope = useTemplateRef<HTMLElement>('scope')
const target = usePortalTarget(scope)
</script>

<template>
  <div
    ref="scope"
    class="ui-toast-scope"
  >
    <ToastProvider
      :label="label"
      :duration="duration"
      disable-swipe
    >
      <slot />
      <ToastPortal
        :to="portalTo ?? target"
        :disabled="!portalTo && !target"
      >
        <ToastViewport
          v-bind="$attrs"
          class="ui-toast-viewport"
          :label="viewportLabel"
          :hotkey="hotkey"
          :data-position="position"
        />
      </ToastPortal>
    </ToastProvider>
  </div>
</template>
