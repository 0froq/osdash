<script setup lang="ts">
import {
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui'
import { useSlots, useTemplateRef } from 'vue'
import { usePortalTarget } from '../../vue'

defineOptions({ inheritAttrs: false })
withDefaults(
  defineProps<{
    label: string
    closeLabel: string
    triggerLabel?: string
    disabled?: boolean
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
    sideOffset?: number
    portalTo?: string | HTMLElement
    reference?: HTMLElement
  }>(),
  { disabled: false, side: 'bottom', align: 'start', sideOffset: 8 },
)
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

/*Non-list overlays: 1px line and --ui-radius. No soft elevation.*/
.ui-popover-content {
  box-sizing: border-box;
  z-index: 1001;
  padding: 24px;
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  background: var(--ui-bg);
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
  line-height: 1.5;
  box-shadow: none;
}

.ui-overlay-close {
  position: absolute;
  top: 14px;
  inset-inline-end: 14px;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  padding: 0;
  border: 0;
  background: none;
  color: var(--ui-muted);
  font: inherit;
  cursor: pointer;
}

.ui-overlay-close:hover {
  color: var(--ui-fg);
}

.ui-overlay-trigger:focus-visible,
.ui-overlay-close:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 4px;
}

.ui-popover-content:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: -1px;
}

.ui-popover-content {
  width: min(22rem, calc(100vw - 24px));
  max-height: calc(100dvh - 24px);
  overflow-y: auto;
  padding-inline-end: 48px;
}
</style>
