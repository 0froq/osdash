<script setup lang="ts" generic="T extends string | string[] = string | string[]">
import type { ChoiceOption } from '../../vue'
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui'
import { computed, useId, useTemplateRef } from 'vue'
import { useControlAttrs, usePortalTarget } from '../../vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{
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
  }>(),
  { multiple: false, disabled: false, ignoreFilter: false },
)
defineSlots<{
  option?: (scope: { option: ChoiceOption; selected: boolean }) => unknown
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
    ? Array.isArray(selected)
      ? selected
      : selected
        ? [selected]
        : []
    : Array.isArray(selected)
      ? (selected[0] ?? '')
      : selected
})
const selectedValues = computed(() =>
  Array.isArray(value.value) ? value.value : value.value ? [value.value] : [],
)
function labelFor(value: string) {
  return props.options.find(option => option.value === value)?.label ?? value
}
function displayValue(value: unknown) {
  return typeof value === 'string' ? labelFor(value) : ''
}
function update(next: unknown) {
  if (props.disabled) return
  model.value = (
    props.multiple
      ? Array.isArray(next)
        ? next.filter((item): item is string => typeof item === 'string')
        : []
      : typeof next === 'string'
        ? next
        : ''
  ) as ModelValue
}
function updateOpen(next: boolean) {
  if (!props.disabled || !next) open.value = next
}
function clear() {
  if (props.disabled) return
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
      >{{ label }}</label
    >
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
          >{{ labelFor(selected) }}</span
        >
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
                  >{{ option.label }}</slot
                >
              </span>
              <ComboboxItemIndicator
                class="ui-combobox-indicator"
                aria-hidden="true"
              />
            </ComboboxItem>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxPortal>
    </ComboboxRoot>
  </div>
</template>

<style scoped>
/*Floating lists share one control-tier surface: hairline, square, no soft elevation.*/
.ui-combobox-content {
  box-sizing: border-box;
  z-index: 1001;
  min-width: min(9.5rem, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  max-height: calc(100dvh - 24px);
  padding: 4px 0;
  overflow-y: auto;
  border: 1px solid var(--ui-line);
  border-radius: 0;
  background: var(--ui-bg);
  box-shadow: none;
  color: var(--ui-fg);
  font: 11px/1.3 var(--ui-font-meta);
  outline: none;
}

.ui-combobox-field {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.ui-combobox-anchor {
  display: flex;
  align-items: center;
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
}

.ui-combobox-anchor:focus-within {
  outline: 2px solid var(--ui-accent);
  outline-offset: 2px;
}

.ui-combobox-input {
  flex: 1;
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--ui-fg);
  font: inherit;
  font-family: var(--ui-font-text);
}

.ui-combobox-input::placeholder,
.ui-combobox-empty {
  color: var(--ui-muted);
}

.ui-combobox-button {
  display: grid;
  flex: 0 0 36px;
  place-items: center;
  min-height: 36px;
  padding: 0;
  border: 0;
  border-radius: var(--ui-radius);
  background: transparent;
  color: var(--ui-muted);
  font: inherit;
  cursor: pointer;
}

.ui-combobox-button:focus-visible {
  outline: 2px solid var(--ui-accent);
  outline-offset: -2px;
}

.ui-combobox-button:disabled,
.ui-combobox-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/*Panel and row chrome are the shared lig list (overlay.css, select.css).*/
.ui-combobox-content {
  width: min(20rem, calc(100vw - 24px));
  max-height: min(20rem, calc(100dvh - 24px));
}

.ui-combobox-empty {
  padding: 12px;
}

.ui-combobox-values {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ui-combobox-value {
  padding: 4px 8px;
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  color: var(--ui-muted);
  font-family: var(--ui-font-text);
}

/*List chrome is shared with Menu in overlay.css. Rows are shared with Combobox.*/
.ui-combobox-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0;
  padding-block: 8px;
  padding-inline: 36px 16px;
  border-radius: 0;
  outline: none;
  cursor: default;
  user-select: none;
}

.ui-combobox-item[data-highlighted] {
  background: none;
  color: var(--ui-fg);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
}

.ui-combobox-item:focus-visible {
  outline: none;
}

.ui-combobox-item[data-state='checked'] {
  background: none;
  color: var(--ui-fg);
}

.ui-combobox-indicator {
  position: absolute;
  top: 50%;
  inset-inline-start: 16px;
  flex: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ui-accent);
  transform: translateY(-50%);
}

.ui-combobox-item[data-disabled] {
  opacity: 0.5;
  pointer-events: none;
}

.ui-field-label {
  color: var(--ui-muted);
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
