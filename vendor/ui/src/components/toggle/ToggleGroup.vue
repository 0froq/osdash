<script setup lang="ts" generic="T extends string | string[] = string | string[]">
import type { ChoiceOption } from '../../vue'
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import { computed, useId } from 'vue'
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{
    label: string
    options: ChoiceOption[]
    type?: 'single' | 'multiple'
    orientation?: 'horizontal' | 'vertical'
    dir?: 'ltr' | 'rtl'
    loop?: boolean
    disabled?: boolean
  }>(),
  { type: 'single', orientation: 'horizontal', loop: true, disabled: false },
)
defineSlots<{ option?: (scope: { option: ChoiceOption; active: boolean }) => unknown }>()
type ModelValue = T extends string[] ? T : T | ''
const model = defineModel<ModelValue>({ default: () => '' as ModelValue })
const id = useId()
const { wrapperAttrs, controlAttrs } = useControlAttrs()
const value = computed<string | string[]>(() => {
  const selected = model.value as string | string[]
  return props.type === 'multiple'
    ? Array.isArray(selected)
      ? selected
      : selected
        ? [selected]
        : []
    : Array.isArray(selected)
      ? (selected[0] ?? '')
      : selected
})
function active(option: ChoiceOption): boolean {
  return Array.isArray(value.value)
    ? value.value.includes(option.value)
    : value.value === option.value
}
function update(next: unknown) {
  if (props.disabled) return
  model.value = (
    props.type === 'multiple'
      ? Array.isArray(next)
        ? next.filter((item): item is string => typeof item === 'string')
        : []
      : typeof next === 'string'
        ? next
        : ''
  ) as ModelValue
}
</script>

<template>
  <div
    v-bind="wrapperAttrs()"
    class="ui-toggle-group-field"
  >
    <span
      :id="id"
      class="ui-field-label"
      >{{ label }}</span
    >
    <ToggleGroupRoot
      v-bind="controlAttrs()"
      class="ui-toggle-group"
      :aria-labelledby="id"
      :type="type"
      :orientation="orientation"
      :dir="dir"
      :loop="loop"
      :disabled="disabled"
      :model-value="value"
      @update:model-value="update"
    >
      <ToggleGroupItem
        v-for="option in options"
        :key="option.value"
        class="ui-toggle-group-item"
        :value="option.value"
        :disabled="option.disabled"
      >
        <slot
          name="option"
          :option="option"
          :active="active(option)"
        >
          {{ option.label }}
        </slot>
      </ToggleGroupItem>
    </ToggleGroupRoot>
  </div>
</template>

<style scoped>
.ui-toggle-group-field {
  display: grid;
  justify-items: start;
  gap: 8px;
}

.ui-toggle-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  font-family: var(--ui-font-text);
  font-size: 14px;
}

.ui-toggle-group[data-orientation='vertical'] {
  flex-direction: column;
  align-items: stretch;
}

.ui-toggle-group-item {
  position: relative;
  min-height: 32px;
  padding: 6px 12px;
  border: 0;
  border-radius: var(--ui-radius);
  background: none;
  color: var(--ui-muted);
  font: inherit;
  font-weight: normal;
  cursor: pointer;
}

.ui-toggle-group-item[data-state='on'] {
  background: var(--ui-faint);
  color: var(--ui-fg);
}

.ui-toggle-group-item[data-state='on']::after {
  position: absolute;
  right: 12px;
  bottom: 0;
  left: 12px;
  height: 2px;
  background: var(--ui-accent);
  content: '';
}

.ui-toggle-group-item:hover:not(:disabled) {
  color: var(--ui-fg);
}

.ui-toggle-group-item:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ui-toggle-group-item:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 1px;
}

.ui-field-label {
  color: var(--ui-muted);
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
