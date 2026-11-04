<script setup lang="ts">
import { HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'
import { computed, onBeforeUnmount, useSlots, useTemplateRef } from 'vue'
import { usePortalTarget } from '../../vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{
    label: string
    href: string
    disabled?: boolean
    openDelay?: number
    closeDelay?: number
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
    sideOffset?: number
    portalTo?: string | HTMLElement
  }>(),
  {
    disabled: false,
    openDelay: 700,
    closeDelay: 300,
    side: 'bottom',
    align: 'start',
    sideOffset: 8,
  },
)
defineSlots<{ trigger?: () => unknown; default: () => unknown }>()
const model = defineModel<boolean>({ default: false })
const slots = useSlots()
const scope = useTemplateRef<HTMLElement>('scope')
const target = usePortalTarget(scope)
const openDelay = computed(() =>
  Number.isFinite(props.openDelay) ? Math.max(0, props.openDelay) : 700,
)
const closeDelay = computed(() =>
  Number.isFinite(props.closeDelay) ? Math.max(0, props.closeDelay) : 300,
)
let alive = true
onBeforeUnmount(() => {
  alive = false
})
function update(value: boolean) {
  if (alive && !props.disabled) model.value = value
}
</script>

<template>
  <div
    ref="scope"
    class="ui-overlay-scope"
  >
    <HoverCardRoot
      :open="model && !disabled"
      :open-delay="openDelay"
      :close-delay="closeDelay"
      @update:open="update"
    >
      <HoverCardTrigger
        :as-child="Boolean(slots.trigger)"
        :href="href"
        :class="{ 'ui-hover-card-trigger': !slots.trigger }"
      >
        <slot name="trigger">
          {{ label }}
        </slot>
      </HoverCardTrigger>
      <HoverCardPortal
        :to="portalTo ?? target"
        :disabled="!portalTo && !target"
      >
        <HoverCardContent
          v-bind="$attrs"
          class="ui ui-hover-card-content"
          aria-hidden="true"
          :side="side"
          :align="align"
          :side-offset="sideOffset"
          :collision-padding="12"
        >
          <slot />
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCardRoot>
  </div>
</template>

<style scoped>
.ui-overlay-scope {
  display: contents;
}

.ui-hover-card-trigger {
  color: var(--ui-fg);
  text-decoration-color: var(--ui-line);
  text-underline-offset: 4px;
}

.ui-hover-card-trigger:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 4px;
}
</style>

<!-- The hover card surface teleports past the component scope, so its chrome is global. -->
<style>
.ui-hover-card-content {
  box-sizing: border-box;
  z-index: 1001;
  width: min(22rem, calc(100vw - 24px));
  max-height: calc(100dvh - 24px);
  padding: 16px;
  overflow-y: auto;
  border: 0;
  border-radius: var(--ui-radius);
  background: var(--ui-bg);
  box-shadow: 0 0 0 1px var(--ui-line);
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
  font-size: 14px;
  line-height: 1.5;
}
</style>
