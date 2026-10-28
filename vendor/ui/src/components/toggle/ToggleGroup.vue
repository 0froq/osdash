<script setup lang="ts" generic="T extends string | string[] = string | string[]">
import type { ChoiceOption } from '../../vue'
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, useTemplateRef, watch } from 'vue'
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  label: string
  options: ChoiceOption[]
  type?: 'single' | 'multiple'
  orientation?: 'horizontal' | 'vertical'
  dir?: 'ltr' | 'rtl'
  loop?: boolean
  disabled?: boolean
  variant?: 'default' | 'pill'
  maxRows?: number
  clearLabel?: string
  expandLabel?: string
  collapseLabel?: string
}>(), { type: 'single', orientation: 'horizontal', loop: true, disabled: false, variant: 'default', expandLabel: 'Show more', collapseLabel: 'Show less' })
defineSlots<{ option?: (scope: { option: ChoiceOption, active: boolean }) => unknown }>()
type ModelValue = T extends string[] ? T : T | ''
const model = defineModel<ModelValue>({ default: () => '' as ModelValue })
const id = useId()
const groupId = useId()
const field = useTemplateRef<HTMLElement>('field')
const expanded = ref(false)
const overflow = ref(false)
const collapsedHeight = ref(0)
const clipped = shallowRef(new Set<string>())
const { wrapperAttrs, controlAttrs } = useControlAttrs()
const value = computed<string | string[]>(() => {
  const selected = model.value as string | string[]
  return props.type === 'multiple'
    ? Array.isArray(selected) ? selected : selected ? [selected] : []
    : Array.isArray(selected) ? selected[0] ?? '' : selected
})
const empty = computed(() => value.value.length === 0)
const rowLimit = computed(() => props.orientation === 'horizontal' && Number.isFinite(props.maxRows) && (props.maxRows ?? 0) >= 1 ? Math.floor(props.maxRows!) : 0)
const signature = computed(() => props.options.map(option => `${option.value}\u0000${option.label}`).join('\u0001'))

function active(option: ChoiceOption): boolean {
  return Array.isArray(value.value) ? value.value.includes(option.value) : value.value === option.value
}
function update(next: unknown) {
  if (props.disabled)
    return
  model.value = (props.type === 'multiple'
    ? Array.isArray(next) ? next.filter((item): item is string => typeof item === 'string') : []
    : typeof next === 'string' ? next : '') as ModelValue
}
function isClipped(value: string): boolean {
  return !expanded.value && clipped.value.has(value)
}
function measure(): void {
  const group = field.value?.querySelector<HTMLElement>('.ui-toggle-group')
  if (!group || !group.getClientRects().length)
    return
  const items = Array.from(group.querySelectorAll<HTMLElement>('[data-toggle-option]'))
  const bounds = items.map(item => item.getBoundingClientRect())
  const rows = [...new Set(bounds.map(rect => Math.round(rect.top)))].sort((a, b) => a - b)
  overflow.value = rowLimit.value > 0 && rows.length > rowLimit.value
  if (!overflow.value) {
    clipped.value = new Set()
    return
  }
  const lastTop = rows[rowLimit.value - 1]!
  const hidden = new Set<string>()
  let bottom = 0
  for (let index = 0; index < items.length; index++) {
    const rect = bounds[index]!
    if (Math.round(rect.top) > lastTop)
      hidden.add(items[index]!.dataset.toggleOption!)
    else
      bottom = Math.max(bottom, rect.bottom)
  }
  const style = getComputedStyle(group)
  collapsedHeight.value = Math.ceil(bottom - group.getBoundingClientRect().top + Number.parseFloat(style.paddingBottom) + Number.parseFloat(style.borderBottomWidth))
  clipped.value = hidden
}

let observer: ResizeObserver | undefined
let disposed = false
function observe(): void {
  observer?.disconnect()
  const group = field.value?.querySelector<HTMLElement>('.ui-toggle-group')
  if (group) {
    observer?.observe(group)
    for (const item of group.querySelectorAll<HTMLElement>('[data-toggle-option]'))
      observer?.observe(item)
  }
}
onMounted(async () => {
  observer = new ResizeObserver(measure)
  observe()
  measure()
  await document.fonts?.ready
  if (!disposed)
    measure()
})
watch([signature, rowLimit, () => props.clearLabel, () => props.variant], () => {
  expanded.value = false
  nextTick(() => {
    observe()
    measure()
  })
})
onBeforeUnmount(() => {
  disposed = true
  observer?.disconnect()
})
</script>

<template>
  <div
    v-bind="wrapperAttrs()"
    ref="field"
    class="ui-toggle-group-field"
    :class="{ 'is-pill': variant === 'pill' }"
  >
    <span
      :id="id"
      class="ui-field-label"
    >{{ label }}</span>
    <ToggleGroupRoot
      v-bind="controlAttrs()"
      :id="groupId"
      class="ui-toggle-group"
      :class="{ 'is-clamped': overflow && !expanded }"
      :style="overflow && !expanded ? { maxHeight: `${collapsedHeight}px` } : undefined"
      :aria-labelledby="id"
      :type="type"
      :orientation="orientation"
      :dir="dir"
      :loop="loop"
      :disabled="disabled"
      :model-value="value"
      @update:model-value="update"
    >
      <button
        v-if="clearLabel"
        type="button"
        class="ui-toggle-group-item ui-toggle-group-clear"
        data-toggle-option=""
        :data-state="empty ? 'on' : 'off'"
        :aria-pressed="empty"
        :disabled="disabled"
        @click="update(type === 'multiple' ? [] : '')"
      >
        {{ clearLabel }}
      </button>
      <ToggleGroupItem
        v-for="option in options"
        :key="option.value"
        class="ui-toggle-group-item"
        :data-toggle-option="option.value"
        :value="option.value"
        :disabled="option.disabled || isClipped(option.value)"
        :inert="isClipped(option.value) || undefined"
        :aria-hidden="isClipped(option.value) || undefined"
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
    <button
      v-if="overflow"
      type="button"
      class="ui-toggle-group-expand"
      :aria-expanded="expanded"
      :aria-controls="groupId"
      @click="expanded = !expanded"
    >
      {{ expanded ? collapseLabel : expandLabel }}
    </button>
  </div>
</template>
