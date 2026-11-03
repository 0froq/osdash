<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { ComponentPublicInstance } from 'vue'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
} from 'reka-ui'
import { computed, nextTick, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { calendarDateBounds, parseCalendarDate } from '../../core'

const props = withDefaults(
  defineProps<{
    label: string
    locale: string
    initialDate: string
    prevLabel: string
    nextLabel: string
    min?: string
    max?: string
    today?: string
    isDateDisabled?: (date: string) => boolean
    disabled?: boolean
    readonly?: boolean
    preventDeselect?: boolean
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
    dir?: 'ltr' | 'rtl'
    initialFocus?: boolean
  }>(),
  { disabled: false, readonly: false, preventDeselect: false, initialFocus: false },
)
const emit = defineEmits<{
  select: [value: string]
  viewChange: [date: string]
}>()
defineSlots<{
  day?: (scope: {
    date: string
    day: string
    selected: boolean
    disabled: boolean
    today: boolean
  }) => unknown
}>()
const model = defineModel<string>({ default: '' })
const root = useTemplateRef<ComponentPublicInstance>('root')
const initial = computed(() => {
  const date = parseCalendarDate(props.initialDate)
  if (!date) throw new RangeError('Calendar initialDate must be a nonempty YYYY-MM-DD date')
  return date
})
const value = computed(() => parseCalendarDate(model.value) ?? null)
const bounds = computed(() => calendarDateBounds(props.min, props.max))
const todayValue = computed(() =>
  props.today === undefined ? undefined : parseCalendarDate(props.today)?.toString(),
)
const placeholder = shallowRef<DateValue>(value.value ?? initial.value)
watch(placeholder, date => emit('viewChange', date.toString()))
watch(initial, date => {
  if (!model.value) placeholder.value = date
})
function dateDisabled(date: DateValue) {
  return (
    props.disabled ||
    Boolean(bounds.value.min && date.compare(bounds.value.min) < 0) ||
    Boolean(bounds.value.max && date.compare(bounds.value.max) > 0) ||
    Boolean(props.isDateDisabled?.(date.toString()))
  )
}
function update(date: DateValue | undefined) {
  if (props.disabled || props.readonly || (date && dateDisabled(date))) return
  const next = date?.toString() ?? ''
  model.value = next
  emit('select', next)
}
function focus() {
  const element = root.value?.$el
  if (props.disabled || typeof HTMLElement === 'undefined' || !(element instanceof HTMLElement))
    return
  const target =
    element.querySelector<HTMLElement>('[data-focused]:not([disabled])') ??
    element.querySelector<HTMLElement>('button:not([disabled])') ??
    element
  target.focus()
}
onMounted(() => {
  if (props.initialFocus) nextTick(focus)
})
defineExpose({ focus })
</script>

<template>
  <CalendarRoot
    ref="root"
    v-slot="{ grid, weekDays }"
    v-model:placeholder="placeholder"
    class="ui-calendar"
    tabindex="-1"
    :model-value="value"
    :calendar-label="label"
    :locale="locale"
    :min-value="bounds.min"
    :max-value="bounds.max"
    :is-date-disabled="dateDisabled"
    :disabled="disabled"
    :readonly="readonly"
    :prevent-deselect="preventDeselect"
    :week-starts-on="weekStartsOn"
    :dir="dir"
    fixed-weeks
    weekday-format="short"
    @update:model-value="update"
  >
    <CalendarHeader class="ui-calendar-header">
      <CalendarPrev
        class="ui-calendar-nav"
        :aria-label="prevLabel"
      >
        <span aria-hidden="true">‹</span>
      </CalendarPrev>
      <CalendarHeading class="ui-calendar-heading" />
      <CalendarNext
        class="ui-calendar-nav"
        :aria-label="nextLabel"
      >
        <span aria-hidden="true">›</span>
      </CalendarNext>
    </CalendarHeader>
    <CalendarGrid
      v-for="month in grid"
      :key="month.value.toString()"
      class="ui-calendar-grid"
      role="grid"
      :aria-label="label"
    >
      <CalendarGridHead>
        <CalendarGridRow>
          <CalendarHeadCell
            v-for="(day, index) in weekDays"
            :key="index"
            class="ui-calendar-weekday"
            scope="col"
          >
            {{ day }}
          </CalendarHeadCell>
        </CalendarGridRow>
      </CalendarGridHead>
      <CalendarGridBody>
        <CalendarGridRow
          v-for="(week, index) in month.rows"
          :key="index"
        >
          <CalendarCell
            v-for="date in week"
            :key="date.toString()"
            :date="date"
          >
            <CalendarCellTrigger
              v-slot="{ dayValue, selected }"
              v-bind="
                date.month === month.value.month && date.year === month.value.year
                  ? {}
                  : { tabindex: -1 }
              "
              class="ui-calendar-day"
              as="button"
              type="button"
              :day="date"
              :month="month.value"
              :disabled="dateDisabled(date)"
              :data-today="date.toString() === todayValue ? '' : undefined"
              :aria-current="date.toString() === todayValue ? 'date' : undefined"
            >
              <slot
                name="day"
                :date="date.toString()"
                :day="dayValue"
                :selected="selected"
                :disabled="dateDisabled(date)"
                :today="date.toString() === todayValue"
              >
                {{ dayValue }}
              </slot>
            </CalendarCellTrigger>
          </CalendarCell>
        </CalendarGridRow>
      </CalendarGridBody>
    </CalendarGrid>
  </CalendarRoot>
</template>

<style scoped>
.ui-calendar {
  box-sizing: border-box;
  width: min(100%, 20rem);
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
}

.ui-calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-block-end: 12px;
}

.ui-calendar-heading {
  font-family: var(--ui-font-meta);
  font-size: 0.875em;
}

.ui-calendar-grid {
  width: 100%;
  table-layout: fixed;
  border-spacing: 2px;
}

.ui-calendar-grid :deep(td) {
  padding: 0;
}

.ui-calendar-weekday {
  padding: 8px 0;
  color: var(--ui-muted);
  font-size: 0.75em;
  font-weight: inherit;
}

.ui-calendar-day,
.ui-calendar-nav {
  display: grid;
  place-items: center;
  box-sizing: border-box;
  min-height: 36px;
  padding: 4px;
  border: 1px solid transparent;
  border-radius: var(--ui-radius);
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.ui-calendar-day {
  width: 100%;
  aspect-ratio: 1;
}

.ui-calendar-nav {
  width: 36px;
}

.ui-calendar[dir='rtl'] .ui-calendar-nav :deep(span) {
  transform: scaleX(-1);
}

.ui-calendar-day[data-outside-view] {
  color: var(--ui-muted);
}

.ui-calendar-day[data-today] {
  border-color: var(--ui-line);
}

.ui-calendar-day[data-selected] {
  background: var(--ui-faint);
  color: var(--ui-accent);
  border-color: var(--ui-line);
}

.ui-calendar-day:hover:not(:disabled),
.ui-calendar-nav:hover:not(:disabled) {
  background: var(--ui-faint);
}

.ui-calendar-day:disabled,
.ui-calendar-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ui-calendar:focus-visible,
.ui-calendar-day:focus-visible,
.ui-calendar-nav:focus-visible {
  outline: 2px solid var(--ui-accent);
  outline-offset: 2px;
}
</style>
