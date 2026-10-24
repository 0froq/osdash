<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue'
import { calendarDateBounds, formatCalendarDate, parseCalendarDate } from '../../core'
import { useControlAttrs, usePortalTarget } from '../../vue'
import Calendar from './Calendar.vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  label: string
  locale: string
  initialDate: string
  placeholder: string
  prevLabel: string
  nextLabel: string
  clearLabel: string
  closeLabel: string
  min?: string
  max?: string
  today?: string
  isDateDisabled?: (date: string) => boolean
  disabled?: boolean
  readonly?: boolean
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  dir?: 'ltr' | 'rtl'
  name?: string
  form?: string
  portalTo?: string | HTMLElement
}>(), { disabled: false, readonly: false })
defineSlots<{ day?: (scope: { date: string, day: string, selected: boolean, disabled: boolean, today: boolean }) => unknown }>()
const model = defineModel<string>({ default: '' })
const open = defineModel<boolean>('open', { default: false })
const viewDate = ref(props.initialDate)
watch(() => props.initialDate, (date) => {
  if (!model.value)
    viewDate.value = date
})
const id = useId()
const scope = useTemplateRef<HTMLElement>('scope')
const trigger = useTemplateRef<ComponentPublicInstance>('trigger')
const calendar = useTemplateRef<InstanceType<typeof Calendar>>('calendar')
const target = usePortalTarget(scope)
const { wrapperAttrs, controlAttrs } = useControlAttrs()
const display = computed(() => formatCalendarDate(model.value, props.locale))
const invalid = computed(() => {
  const date = parseCalendarDate(model.value)
  const bounds = calendarDateBounds(props.min, props.max)
  return Boolean(date && ((bounds.min && date.compare(bounds.min) < 0)
    || (bounds.max && date.compare(bounds.max) > 0) || props.isDateDisabled?.(model.value)))
})
function updateOpen(next: boolean) {
  if (!props.disabled || !next)
    open.value = next
}
function clear() {
  if (props.disabled || props.readonly)
    return
  const button = trigger.value?.$el
  if (typeof HTMLElement !== 'undefined' && button instanceof HTMLElement)
    button.focus()
  model.value = ''
  open.value = false
}
function focusCalendar(event: Event) {
  event.preventDefault()
  nextTick(() => calendar.value?.focus())
}
</script>

<template>
  <div
    ref="scope"
    v-bind="wrapperAttrs()"
    class="ui-date-picker"
    :dir="dir"
  >
    <span
      :id="`${id}-label`"
      class="ui-field-label"
    >{{ label }}</span>
    <PopoverRoot
      :open="open && !disabled"
      @update:open="updateOpen"
    >
      <div class="ui-date-picker-control">
        <PopoverTrigger
          ref="trigger"
          v-bind="controlAttrs()"
          class="ui-date-picker-trigger"
          type="button"
          :disabled="disabled"
          :aria-labelledby="`${id}-label ${id}-value`"
          :aria-invalid="invalid || undefined"
        >
          <span :id="`${id}-value`">{{ display || placeholder }}</span>
          <span aria-hidden="true">⌄</span>
        </PopoverTrigger>
        <button
          type="button"
          class="ui-date-picker-clear"
          :aria-label="clearLabel"
          :disabled="disabled || readonly || !model"
          @click="clear"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <PopoverPortal
        :to="portalTo ?? target"
        :disabled="!portalTo && !target"
      >
        <PopoverContent
          class="ui-date-picker-content"
          :aria-label="label"
          :dir="dir"
          align="start"
          :side-offset="6"
          :collision-padding="12"
          @open-auto-focus="focusCalendar"
        >
          <Calendar
            ref="calendar"
            v-model="model"
            :label="label"
            :locale="locale"
            :initial-date="viewDate"
            :min="min"
            :max="max"
            :today="today"
            :is-date-disabled="isDateDisabled"
            :readonly="readonly"
            :week-starts-on="weekStartsOn"
            :dir="dir"
            :disabled="disabled"
            :prevent-deselect="true"
            :prev-label="prevLabel"
            :next-label="nextLabel"
            @select="open = false"
            @view-change="viewDate = $event"
          >
            <template #day="day">
              <slot
                name="day"
                v-bind="day"
              >
                {{ day.day }}
              </slot>
            </template>
          </Calendar>
          <PopoverClose class="ui-date-picker-close">
            {{ closeLabel }}
          </PopoverClose>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
    <input
      v-if="name"
      type="hidden"
      :name="name"
      :form="form"
      :value="model"
      :disabled="disabled"
    >
  </div>
</template>
