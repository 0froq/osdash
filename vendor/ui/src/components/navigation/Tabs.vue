<script setup lang="ts" generic="T extends string">
import type { ChoiceOption } from '../../vue'
import { useId, useTemplateRef, watch } from 'vue'
import { useTabs } from '../../vue'

const props = withDefaults(
  defineProps<{
    items: ChoiceOption<T>[]
    label: string
    orientation?: 'horizontal' | 'vertical'
    activation?: 'automatic' | 'manual'
  }>(),
  { orientation: 'horizontal', activation: 'automatic' },
)
defineSlots<{
  label?: (scope: { item: ChoiceOption<T>; active: boolean }) => unknown
  default?: (scope: { item: ChoiceOption<T>; active: boolean }) => unknown
}>()
const model = defineModel<T>({ required: true })
const id = useId()
const { tabindex, select, onKeydown } = useTabs(
  () => props.items,
  model,
  () => props.orientation,
  () => props.activation,
)
const itemId = (value: T) => `${id}-${encodeURIComponent(value)}`
const root = useTemplateRef<HTMLElement>('root')
watch(model, (next, previous) => {
  if (typeof document === 'undefined') return
  const panel = document.getElementById(`${itemId(previous)}-panel`)
  if (panel?.contains(document.activeElement)) {
    const target =
      props.items.find(item => item.value === next && !item.disabled) ??
      props.items.find(item => !item.disabled)
    if (target) document.getElementById(`${itemId(target.value)}-tab`)?.focus()
    else root.value?.focus()
  }
})
</script>

<template>
  <div
    ref="root"
    class="ui-tabs"
    tabindex="-1"
    :class="{ 'is-vertical': orientation === 'vertical' }"
  >
    <div
      class="ui-tabs-list"
      role="tablist"
      :aria-label="label"
      :aria-orientation="orientation"
    >
      <button
        v-for="item in items"
        :id="`${itemId(item.value)}-tab`"
        :key="item.value"
        class="ui-tabs-trigger"
        type="button"
        role="tab"
        :disabled="item.disabled"
        :aria-selected="model === item.value"
        :aria-controls="`${itemId(item.value)}-panel`"
        :tabindex="tabindex(item.value)"
        @click="select(item.value)"
        @keydown="onKeydown($event, item.value)"
      >
        <slot
          name="label"
          :item="item"
          :active="model === item.value"
        >
          {{ item.label }}
        </slot>
      </button>
    </div>
    <div
      v-for="item in items"
      :id="`${itemId(item.value)}-panel`"
      :key="item.value"
      class="ui-tabs-panel"
      role="tabpanel"
      :aria-labelledby="`${itemId(item.value)}-tab`"
      :hidden="model !== item.value"
      :inert="model !== item.value ? true : undefined"
      tabindex="0"
    >
      <slot
        :item="item"
        :active="model === item.value"
      />
    </div>
  </div>
</template>

<style scoped>
.ui-tabs {
  min-width: 0;
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
}

.ui-tabs-list {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  border-bottom: 1px solid var(--ui-line);
}

.ui-tabs-trigger {
  flex: none;
  padding: 10px 0;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--ui-muted);
  cursor: pointer;
  font: inherit;
  text-align: start;
}

.ui-tabs-trigger[aria-selected='true'] {
  border-color: var(--ui-accent);
  color: var(--ui-fg);
}

.ui-tabs-trigger:hover:not(:disabled) {
  color: var(--ui-fg);
}

.ui-tabs-trigger:disabled {
  color: var(--ui-faint);
  cursor: not-allowed;
}

.ui-tabs-trigger:focus-visible,
.ui-tabs-panel:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: -1px;
}

.ui-tabs-panel {
  min-width: 0;
  padding-block: 16px;
}

.ui-tabs-panel[hidden] {
  display: none;
}

.ui-tabs.is-vertical {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 24px;
}

.ui-tabs.is-vertical .ui-tabs-list {
  flex-direction: column;
  gap: 4px;
  border: 0;
  border-inline-end: 1px solid var(--ui-line);
}

.ui-tabs.is-vertical .ui-tabs-trigger {
  padding: 8px 16px 8px 0;
  border: 0;
  border-inline-end: 2px solid transparent;
}

.ui-tabs.is-vertical .ui-tabs-trigger[aria-selected='true'] {
  border-color: var(--ui-accent);
}
</style>
