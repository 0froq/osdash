<script setup lang="ts" generic="T extends string">
import type { ChoiceOption } from '../../vue'
import { useId, useTemplateRef, watch } from 'vue'
import { useTabs } from '../../vue'

const props = withDefaults(defineProps<{
  items: ChoiceOption<T>[]
  label: string
  orientation?: 'horizontal' | 'vertical'
  activation?: 'automatic' | 'manual'
}>(), { orientation: 'horizontal', activation: 'automatic' })
defineSlots<{
  label?: (scope: { item: ChoiceOption<T>, active: boolean }) => unknown
  default?: (scope: { item: ChoiceOption<T>, active: boolean }) => unknown
}>()
const model = defineModel<T>({ required: true })
const id = useId()
const { tabindex, select, onKeydown } = useTabs(() => props.items, model, () => props.orientation, () => props.activation)
const itemId = (value: T) => `${id}-${encodeURIComponent(value)}`
const root = useTemplateRef<HTMLElement>('root')
watch(model, (next, previous) => {
  if (typeof document === 'undefined')
    return
  const panel = document.getElementById(`${itemId(previous)}-panel`)
  if (panel?.contains(document.activeElement)) {
    const target = props.items.find(item => item.value === next && !item.disabled) ?? props.items.find(item => !item.disabled)
    if (target)
      document.getElementById(`${itemId(target.value)}-tab`)?.focus()
    else
      root.value?.focus()
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
