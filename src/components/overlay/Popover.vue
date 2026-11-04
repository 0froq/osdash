<script setup lang="ts">
import {
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui'
import { useTemplateRef } from 'vue'
import { usePortalTarget } from '../../vue'
import Button from '../button/Button.vue'

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
        as-child
        :disabled="disabled"
      >
        <slot name="trigger">
          <Button :disabled="disabled">{{ triggerLabel ?? label }}</Button>
        </slot>
      </PopoverTrigger>
      <PopoverPortal
        :to="portalTo ?? target"
        :disabled="!portalTo && !target"
      >
        <PopoverContent
          v-bind="$attrs"
          class="ui ui-popover-content"
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

/*Non-list overlays: 1px line and --ui-radius. No soft elevation.*/
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

.ui-overlay-close:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 4px;
}
</style>

<!-- The popover surface teleports past the component scope, so its chrome is global. -->
<style>
.ui-popover-content {
  box-sizing: border-box;
  z-index: 1001;
  width: min(22rem, calc(100vw - 24px));
  max-height: calc(100dvh - 24px);
  padding: 24px;
  padding-inline-end: 48px;
  overflow-y: auto;
  border: 0;
  border-radius: var(--ui-radius);
  background: var(--ui-bg);
  box-shadow: 0 0 0 1px var(--ui-line);
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
  line-height: 1.5;
}

.ui-popover-content:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: -1px;
}
</style>
