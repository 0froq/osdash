<script setup lang="ts">
import { ToastPortal, ToastProvider, ToastViewport } from 'reka-ui'
import { useTemplateRef } from 'vue'
import { usePortalTarget } from '../../vue'

defineOptions({ inheritAttrs: false })
withDefaults(
  defineProps<{
    label: string
    viewportLabel: string
    duration?: number
    hotkey?: string[]
    position?: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
    portalTo?: string | HTMLElement
  }>(),
  { duration: 5000, hotkey: () => ['F8'], position: 'bottom-end' },
)
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

<style scoped>
.ui-toast-scope {
  display: contents;
}

.ui-toast-viewport {
  position: fixed;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
  width: min(24rem, calc(100vw - 24px));
  max-height: calc(100dvh - 24px);
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.ui-toast-viewport[data-position^='top'] {
  top: 12px;
}

.ui-toast-viewport[data-position^='bottom'] {
  bottom: 12px;
}

.ui-toast-viewport[data-position$='start'] {
  inset-inline-start: 12px;
}

.ui-toast-viewport[data-position$='end'] {
  inset-inline-end: 12px;
}

.ui-toast-viewport:focus-visible {
  outline: 2px solid var(--ui-accent);
  outline-offset: 2px;
}
</style>
