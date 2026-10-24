<script setup lang="ts" generic="T extends string | string[] = string | string[]">
import type { ChoiceOption } from '../../vue'
import { ComboboxAnchor, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from 'reka-ui'
import { computed, useId, useTemplateRef } from 'vue'
import { useControlAttrs, usePortalTarget } from '../../vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  label: string
  options: ChoiceOption[]
  toggleLabel: string
  clearLabel: string
  emptyLabel: string
  placeholder?: string
  multiple?: boolean
  disabled?: boolean
  ignoreFilter?: boolean
  name?: string
  dir?: 'ltr' | 'rtl'
  portalTo?: string | HTMLElement
}>(), { multiple: false, disabled: false, ignoreFilter: false })
defineSlots<{
  option?: (scope: { option: ChoiceOption, selected: boolean }) => unknown
  empty?: () => unknown
}>()
type ModelValue = T extends string[] ? T : T | ''
const model = defineModel<ModelValue>({ default: () => '' as ModelValue })
const search = defineModel<string>('search', { default: '' })
const open = defineModel<boolean>('open', { default: false })
const id = useId()
const scope = useTemplateRef<HTMLElement>('scope')
const input = useTemplateRef<{ $el: HTMLInputElement }>('input')
const target = usePortalTarget(scope)
const { wrapperAttrs, controlAttrs } = useControlAttrs()
const value = computed<string | string[]>(() => {
  const selected = model.value as string | string[]
  return props.multiple
    ? Array.isArray(selected) ? selected : selected ? [selected] : []
    : Array.isArray(selected) ? selected[0] ?? '' : selected
})
const selectedValues = computed(() => Array.isArray(value.value) ? value.value : value.value ? [value.value] : [])
function labelFor(value: string) {
  return props.options.find(option => option.value === value)?.label ?? value
}
function displayValue(value: unknown) {
  return typeof value === 'string' ? labelFor(value) : ''
}
function update(next: unknown) {
  if (props.disabled)
    return
  model.value = (props.multiple
    ? Array.isArray(next) ? next.filter((item): item is string => typeof item === 'string') : []
    : typeof next === 'string' ? next : '') as ModelValue
}
function updateOpen(next: boolean) {
  if (!props.disabled || !next)
    open.value = next
}
function clear() {
  if (props.disabled)
    return
  // The clear button becomes disabled after this update; keep keyboard focus usable.
  input.value?.$el.focus({ preventScroll: true })
  update(props.multiple ? [] : '')
  search.value = ''
  open.value = false
}
</script>

<template>
  <div
    ref="scope"
    v-bind="wrapperAttrs()"
    class="ui-combobox-field"
  >
    <label
      :for="id"
      class="ui-field-label"
    >{{ label }}</label>
    <ComboboxRoot
      :model-value="value"
      :open="open && !disabled"
      :multiple="multiple"
      :disabled="disabled"
      :ignore-filter="ignoreFilter"
      :name="name"
      :dir="dir"
      @update:model-value="update"
      @update:open="updateOpen"
    >
      <ComboboxAnchor class="ui-combobox-anchor">
        <ComboboxInput
          v-bind="controlAttrs()"
          :id="id"
          ref="input"
          v-model="search"
          class="ui-combobox-input"
          :placeholder="placeholder"
          :display-value="displayValue"
        />
        <button
          type="button"
          class="ui-combobox-button"
          :aria-label="clearLabel"
          :disabled="disabled || (!selectedValues.length && !search)"
          @click="clear"
        >
          <span aria-hidden="true">×</span>
        </button>
        <ComboboxTrigger
          class="ui-combobox-button"
          :aria-label="toggleLabel"
        >
          <span aria-hidden="true">⌄</span>
        </ComboboxTrigger>
      </ComboboxAnchor>
      <div
        v-if="multiple && selectedValues.length"
        class="ui-combobox-values"
      >
        <span
          v-for="selected in selectedValues"
          :key="selected"
          class="ui-combobox-value"
        >{{ labelFor(selected) }}</span>
      </div>
      <ComboboxPortal
        :to="portalTo ?? target"
        :disabled="!portalTo && !target"
      >
        <ComboboxContent
          class="ui-combobox-content"
          position="popper"
          align="start"
          :side-offset="6"
          :collision-padding="12"
        >
          <ComboboxViewport>
            <ComboboxEmpty class="ui-combobox-empty">
              <slot name="empty">
                {{ emptyLabel }}
              </slot>
            </ComboboxEmpty>
            <ComboboxItem
              v-for="option in options"
              :key="option.value"
              class="ui-combobox-item"
              :value="option.value"
              :text-value="option.label"
              :disabled="option.disabled"
            >
              <span>
                <slot
                  name="option"
                  :option="option"
                  :selected="selectedValues.includes(option.value)"
                >{{ option.label }}</slot>
              </span>
              <ComboboxItemIndicator aria-hidden="true">
                ✓
              </ComboboxItemIndicator>
            </ComboboxItem>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxPortal>
    </ComboboxRoot>
  </div>
</template>
