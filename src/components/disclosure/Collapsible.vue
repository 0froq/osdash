<script setup lang="ts">
import type { CollapsibleTriggerProps } from '../../vue'
import { computed, useId, useTemplateRef, watch } from 'vue'
import { useDisclosure } from '../../vue'

const props = withDefaults(
  defineProps<{
    label: string
    disabled?: boolean
  }>(),
  { disabled: false },
)
defineSlots<{
  trigger?: (scope: { open: boolean; props: CollapsibleTriggerProps }) => unknown
  default?: (scope: { open: boolean }) => unknown
}>()
const model = defineModel<boolean>({ default: false })
const id = useId()
const triggerId = `${id}-trigger`
const panelId = `${id}-panel`
const panel = useTemplateRef<HTMLElement>('panel')
const { toggle } = useDisclosure(model, () => props.disabled)
const triggerProps = computed<CollapsibleTriggerProps>(() => ({
  'id': triggerId,
  'type': 'button',
  'class': 'ui-collapsible-trigger',
  'disabled': props.disabled,
  'aria-expanded': model.value,
  'aria-controls': panelId,
  'onClick': toggle,
}))

// Default pre-flush runs before the panel becomes hidden. Never steal outside focus.
watch(model, open => {
  if (!open && typeof document !== 'undefined' && panel.value?.contains(document.activeElement))
    document.getElementById(triggerId)?.focus()
})
</script>

<template>
  <div
    class="ui-collapsible"
    :class="{ 'is-open': model }"
  >
    <slot
      name="trigger"
      :open="model"
      :props="triggerProps"
    >
      <button v-bind="triggerProps">
        <span>{{ label }}</span>
        <span
          class="ui-collapsible-chevron"
          aria-hidden="true"
        />
      </button>
    </slot>
    <div
      :id="panelId"
      ref="panel"
      class="ui-collapsible-panel"
      :hidden="!model"
      :inert="model ? undefined : true"
      :aria-hidden="model ? undefined : true"
    >
      <div class="ui-collapsible-clip">
        <div class="ui-collapsible-body">
          <slot :open="model" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-collapsible {
  min-width: 0;
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
}

:deep(.ui-collapsible-trigger) {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  padding: 22px 0 18px;
  border: 0;
  background-color: transparent;
  box-shadow: 0 0 20px 10px transparent;
  color: var(--ui-muted);
  font: 15px/1.3 var(--ui-font-text);
  text-align: start;
  cursor: pointer;
  transition:
    color 0.4s var(--ui-ease),
    background-color 0.4s var(--ui-ease),
    box-shadow 0.4s var(--ui-ease);
}

:deep(.ui-collapsible-trigger:hover:not(:disabled)),
.ui-collapsible.is-open :deep(.ui-collapsible-trigger) {
  color: var(--ui-fg);
}

/*While the panel is open its title stays pinned to the top, the way an editor pins the scope you are
   inside, and lets go where the panel ends. A host with a fixed bar overrides `top`.*/
.ui-collapsible.is-open > :deep(.ui-collapsible-trigger) {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: var(--ui-bg);
  box-shadow: 0 0 20px 10px var(--ui-bg);
}

/*Content slides under the pinned title and fades out beneath it. Unpinned, the fade rests on the
   body's own top padding and shows nothing.*/
.ui-collapsible.is-open > :deep(.ui-collapsible-trigger::before) {
  content: '';
  position: absolute;
  inset-inline: 0;
  top: 100%;
  height: 20px;
  background: linear-gradient(var(--ui-bg), transparent);
  pointer-events: none;
}

:deep(.ui-collapsible-trigger:focus-visible) {
  outline: none;
}

:deep(.ui-collapsible-trigger:disabled) {
  color: var(--ui-muted);
  cursor: not-allowed;
}

/*A hairline rests beside the label. Hover grows an accent fade; open and focus close it into one accent line.*/
:deep(.ui-collapsible-trigger::after) {
  content: '';
  flex: 1 1 auto;
  height: 1px;
  --ui-collapsible-rule-end: transparent;
  background-image:
    linear-gradient(90deg, var(--ui-accent), var(--ui-collapsible-rule-end)),
    linear-gradient(90deg, var(--ui-line) 0%, transparent 100%);
  background-size:
    0% 1px,
    100% 1px;
  background-repeat: no-repeat;
  background-position: left center;
  transition:
    background-size 0.55s var(--ui-ease),
    --ui-collapsible-rule-end 0.55s var(--ui-ease);
}

:deep(.ui-collapsible-trigger:hover:not(:disabled)::after) {
  background-size:
    100% 1px,
    100% 1px;
}

.ui-collapsible.is-open :deep(.ui-collapsible-trigger::after),
:deep(.ui-collapsible-trigger:focus-visible::after) {
  --ui-collapsible-rule-end: var(--ui-accent);
  background-size:
    100% 1px,
    100% 1px;
}

.ui-collapsible-chevron {
  width: 7px;
  height: 7px;
  flex: none;
  margin-inline-end: 2px;
  border-inline-end: 1px solid currentColor;
  border-block-end: 1px solid currentColor;
  opacity: 0.55;
  transform: rotate(-45deg);
  transition:
    transform 0.45s var(--ui-ease),
    opacity 0.45s var(--ui-ease);
}

:deep(.ui-collapsible-trigger[aria-expanded='true'] .ui-collapsible-chevron) {
  transform: rotate(45deg);
}

:deep(.ui-collapsible-trigger:hover:not(:disabled) .ui-collapsible-chevron),
.ui-collapsible.is-open .ui-collapsible-chevron {
  opacity: 1;
}

/*The UA hides [hidden] with !important. Keep the panel measurable so it can close.*/
.ui-collapsible-panel,
.ui-collapsible-panel[hidden] {
  display: grid !important;
  grid-template-rows: 0fr;
  padding: 0;
  opacity: 0;
  transition:
    grid-template-rows 320ms var(--ui-ease),
    opacity 180ms var(--ui-ease);
}

.ui-collapsible.is-open .ui-collapsible-panel {
  grid-template-rows: 1fr;
  opacity: 1;
}

.ui-collapsible-clip {
  min-height: 0;
  overflow: hidden;
}

.ui-collapsible-body {
  padding-block: 20px 8px;
  padding-inline-start: 20px;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.ui-collapsible-trigger),
  :deep(.ui-collapsible-trigger::after),
  .ui-collapsible-chevron,
  .ui-collapsible-panel,
  .ui-collapsible-panel[hidden] {
    transition: none;
  }
}

@property --ui-collapsible-rule-end {
  syntax: '<color>';
  inherits: false;
  initial-value: transparent;
}
</style>
