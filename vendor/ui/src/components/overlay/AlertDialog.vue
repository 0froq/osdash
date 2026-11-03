<script setup lang="ts">
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'reka-ui'
import { useSlots, useTemplateRef } from 'vue'
import { usePortalTarget } from '../../vue'
import Button from '../button/Button.vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{
    title: string
    description: string
    cancelLabel: string
    confirmLabel: string
    triggerLabel?: string
    disabled?: boolean
    pending?: boolean
    confirmDisabled?: boolean
    portalTo?: string | HTMLElement
  }>(),
  { disabled: false, pending: false, confirmDisabled: false },
)
const emit = defineEmits<{ confirm: [event: MouseEvent] }>()
defineSlots<{
  trigger?: () => unknown
  default?: () => unknown
}>()
const model = defineModel<boolean>({ default: false })
const slots = useSlots()
const scope = useTemplateRef<HTMLElement>('scope')
const target = usePortalTarget(scope)
function confirm(event: MouseEvent) {
  if (props.pending || props.confirmDisabled) return
  emit('confirm', event)
  if (!event.defaultPrevented) model.value = false
}
</script>

<template>
  <div
    ref="scope"
    class="ui-overlay-scope"
  >
    <AlertDialogRoot v-model:open="model">
      <AlertDialogTrigger
        :as-child="Boolean(slots.trigger)"
        :disabled="disabled"
        class="ui-overlay-trigger"
      >
        <slot name="trigger">
          {{ triggerLabel ?? title }}
        </slot>
      </AlertDialogTrigger>
      <AlertDialogPortal
        :to="portalTo ?? target"
        :disabled="!portalTo && !target"
      >
        <AlertDialogOverlay class="ui-dialog-overlay" />
        <AlertDialogContent
          v-bind="$attrs"
          class="ui-dialog-content ui-alert-dialog-content"
          :aria-busy="pending || undefined"
        >
          <header class="ui-dialog-header">
            <AlertDialogTitle class="ui-dialog-title">
              {{ title }}
            </AlertDialogTitle>
            <AlertDialogDescription class="ui-dialog-description">
              {{ description }}
            </AlertDialogDescription>
          </header>
          <div
            v-if="slots.default"
            class="ui-dialog-body"
          >
            <slot />
          </div>
          <footer class="ui-dialog-footer">
            <AlertDialogCancel as-child>
              <Button>{{ cancelLabel }}</Button>
            </AlertDialogCancel>
            <Button
              class="ui-alert-dialog-confirm"
              :disabled="pending || confirmDisabled"
              @click="confirm"
            >
              {{ confirmLabel }}
            </Button>
          </footer>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>
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

.ui-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: color-mix(in srgb, var(--ui-bg) 75%, transparent);
}

/*Non-list overlays: 1px line and --ui-radius. No soft elevation.*/
.ui-dialog-content {
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

.ui-dialog-content {
  position: fixed;
  top: 50%;
  left: 50%;
  width: min(32rem, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  transform: translate(-50%, -50%);
}

.ui-alert-dialog-content .ui-dialog-title {
  padding-inline-end: 0;
}

.ui-alert-dialog-confirm.ui-button {
  border-color: var(--ui-accent);
  color: var(--ui-accent);
}

.ui-alert-dialog-confirm.ui-button:disabled {
  border-color: var(--ui-line);
  color: var(--ui-muted);
}

.ui-dialog-title {
  margin: 0;
  padding-inline-end: 32px;
  font-family: var(--ui-font-display);
  font-size: 28px;
  font-weight: normal;
  line-height: 1.2;
}

.ui-dialog-description {
  margin: 8px 0 0;
  color: var(--ui-muted);
  font-size: 14px;
}

.ui-dialog-body {
  margin-block: 24px;
}

.ui-dialog-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  gap: 16px;
  padding-block-start: 16px;
  border-top: 1px solid var(--ui-line);
}

.ui-overlay-trigger:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 4px;
}

.ui-dialog-content:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: -1px;
}
</style>
