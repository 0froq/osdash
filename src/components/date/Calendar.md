---
title: Calendar
designStatus: ai-draft
description: A single-month Gregorian date calendar with string values.
model:
  type: string
  default: "''"
  description: Selected date in YYYY-MM-DD form, or an empty string when unset.
props:
  - name: label
    type: string
    required: true
    description: Accessible calendar name.
  - name: locale
    type: string
    required: true
    description: Intl locale used for month, weekday, and day labels.
  - name: initialDate
    type: string
    required: true
    description: Non-empty YYYY-MM-DD date used for the initial visible month when no value is selected.
  - name: prevLabel
    type: string
    required: true
    description: Accessible name for the previous-month button.
  - name: nextLabel
    type: string
    required: true
    description: Accessible name for the next-month button.
  - name: min
    type: string
    description: Inclusive minimum selectable date in YYYY-MM-DD form.
  - name: max
    type: string
    description: Inclusive maximum selectable date in YYYY-MM-DD form.
  - name: today
    type: string
    description: Optional caller-supplied YYYY-MM-DD marker; no local-today value is inferred by the component.
  - name: isDateDisabled
    type: "(date: string) => boolean"
    description: Callback that disables a Gregorian date string.
  - name: disabled
    type: boolean
    default: "false"
    description: Disable date selection and calendar navigation.
  - name: readonly
    type: boolean
    default: "false"
    description: Allow navigation but prevent date selection and clearing.
  - name: preventDeselect
    type: boolean
    default: "false"
    description: Prevent clicking the selected day from clearing the selection.
  - name: weekStartsOn
    type: "0 | 1 | 2 | 3 | 4 | 5 | 6"
    description: First weekday, from Sunday (0) through Saturday (6); defaults from the locale.
  - name: dir
    type: "'ltr' | 'rtl'"
    description: Reading and keyboard direction; defaults to the Reka UI direction context, then ltr.
  - name: initialFocus
    type: boolean
    default: "false"
    description: Focus the calendar after mount.
events:
  - name: viewChange
    payload: string
    description: Gregorian date anchoring the visible month or keyboard focus after it changes; this does not imply selection.
  - name: select
    payload: string
    description: Emitted for each user selection, including an empty string when deselected and a re-selection of the same day.
slots:
  - name: day
    description: Receives date, day, selected, disabled, and today for read-only day content; do not add interactive descendants.
---

Calendar is a single-month Gregorian calendar rendered as a six-week grid. Its model is a date-only `YYYY-MM-DD` string, or `''` when no day is selected. It does not convert the model through local time zones. `locale` controls language and display formatting; it does not change the Gregorian model. `today` is an optional marker supplied by the caller, not an inferred local date. The component does not mark a date as today when this prop is omitted.

`initialDate` must be a stable, valid `YYYY-MM-DD` date and determines the initial visible month when the model is empty. If `initialDate` changes while the model is empty, the visible month updates. Clearing a selection leaves the browsed month in place. A non-empty invalid model, invalid `initialDate`, invalid bound, or `min` later than `max` throws a `RangeError`. The supported year range is 0001 through 9999. External values outside `min`/`max` or disabled by the callback are retained; Calendar does not coerce or correct them. Dates shown from adjacent months remain selectable unless disabled by a bound or callback.

`select` emits a string whenever the user selects or clears a day, including a same-day re-selection. `readonly` still allows month navigation but prevents selection and deselection. `disabled` prevents both selection and navigation. With `preventDeselect` false, clicking the selected day clears the model and emits `select` with `''`.

The day slot receives `{ date, day, selected, disabled, today }`; its content is placed inside the day button and should remain non-interactive. Calendar supports arrow-key movement between days and Enter/Space selection, plus Tab navigation through native buttons. It does not implement range selection, year/month dropdowns, or additional paging key commands. `initialFocus` focuses a day marked `data-focused`; otherwise it focuses the first enabled button (typically a month-navigation button), then falls back to the calendar root. The exposed `focus()` method uses the same targeting behavior. Undeclared attributes are applied to the calendar root.

Calendar is a date-selection primitive, not a form input: it has no native form submission, `name`, or `required` validation. Use `DateInput`, `DatePicker`, or consumer-owned form handling when form behavior is needed.

## Usage

```vue
<script setup lang="ts">
import { Calendar } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const selected = ref('')
const disabledDates = new Set(['2026-09-12'])

function isDateDisabled(date: string) {
  return disabledDates.has(date)
}
</script>

<template>
  <div class="ui">
    <Calendar
      v-model="selected"
      label="Choose a date"
      locale="en-US"
      initial-date="2026-09-01"
      prev-label="Previous month"
      next-label="Next month"
      :is-date-disabled="isDateDisabled"
      @select="date => console.info('Selected date:', date)"
    />
  </div>
</template>
```
