---
title: DatePicker
designStatus: ai-draft
description: A localized date field with a popover calendar and hidden form value.
model:
  type: string
  default: "''"
  description: Selected Gregorian date in YYYY-MM-DD form, or an empty string.
props:
  - name: label
    type: string
    required: true
    description: Visible field label and calendar name.
  - name: locale
    type: string
    required: true
    description: Intl locale used to format the selected date and calendar labels.
  - name: initialDate
    type: string
    required: true
    description: Non-empty YYYY-MM-DD date used for the initial calendar month when no value is selected.
  - name: placeholder
    type: string
    required: true
    description: Text shown when no date is selected.
  - name: prevLabel
    type: string
    required: true
    description: Accessible name for the previous-month button.
  - name: nextLabel
    type: string
    required: true
    description: Accessible name for the next-month button.
  - name: clearLabel
    type: string
    required: true
    description: Accessible name for the clear button.
  - name: closeLabel
    type: string
    required: true
    description: Text for the button that closes the calendar popover.
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
    description: Disable the trigger and clearing; the displayed popup is closed while disabled.
  - name: readonly
    type: boolean
    default: "false"
    description: Allow browsing but prevent selection and clearing.
  - name: weekStartsOn
    type: "0 | 1 | 2 | 3 | 4 | 5 | 6"
    description: First weekday, from Sunday (0) through Saturday (6); defaults from the locale.
  - name: dir
    type: "'ltr' | 'rtl'"
    description: Reading and keyboard direction; defaults to the Reka UI direction context, then ltr.
  - name: name
    type: string
    description: Optional native form name for the hidden ISO date value.
  - name: form
    type: string
    description: Optional HTML form ID for the hidden date input.
  - name: portalTo
    type: "string | HTMLElement"
    description: Teleport target. Defaults to the nearest ancestor with class ui; without one, content renders inline on the client.
slots:
  - name: day
    description: Receives date, day, selected, disabled, and today for read-only day content; do not add interactive descendants.
---

DatePicker displays a locale-formatted field and opens a single-month, six-week Gregorian calendar. Its model is a date-only `YYYY-MM-DD` string, or `''` when unset; it is not converted through local time zones. The required `locale` affects display formatting, not the Gregorian model. `today` is an optional marker supplied by the caller, not an inferred local date. The required `initialDate` must be stable and valid for SSR. It determines the visible month while the model is empty; changing it updates that month only while the model remains empty. Clearing a selected date keeps the current browsed month.

Selecting a day closes the popover, including selecting the same day again. The picker prevents deselection by clicking the selected day; use the clear button, labeled by `clearLabel`, to set the model to `''` and close the popup. `readonly` still allows opening and browsing but prevents selection and clearing. `disabled` closes the displayed popup and disables the trigger and clear control; it does not automatically rewrite `v-model:open`. That separate boolean model defaults to `false`.

`min`, `max`, and `isDateDisabled` constrain calendar selection. A non-empty invalid Gregorian date, invalid bound, or `min` later than `max` throws a `RangeError`; years 0001 through 9999 are supported. Values supplied externally that fall outside the bounds or match a disabled date are retained rather than corrected. With `name`, DatePicker submits the selected ISO string through a hidden input, optionally associated to a form using `form`. It does not provide native `required`, `min`, or `max` form validation; use `DateInput` or consumer-owned validation if native validation is required.

`class` and `style` are applied to the outer field wrapper. Other undeclared attributes are applied to the trigger button; an `id` therefore labels that button, not the hidden input. `name` and `form` are explicit props for the hidden input. The `day` slot receives `{ date, day, selected, disabled, today }` and renders inside a day button, so its content should remain non-interactive.

Opening the popover moves focus into the calendar, targeting a day marked `data-focused`, then the first enabled button (typically a month-navigation button), with the calendar root as a final fallback. Calendar arrow keys move between days; Enter/Space select; Tab follows native focus order through the calendar and close button. Escape and outside interaction close the popover through Reka UI. Closing from the picker returns focus to its trigger; outside dismissal leaves focus with the outside target. The component does not provide range selection, month/year dropdowns, extra paging keys, or swipe gestures.

By default, the popover is teleported to the nearest consumer ancestor with class `.ui`; without one, it renders inline on the client. A custom `portalTo` target must exist and provide the consumer's theme and UI tokens. Import `style.css` and provide the `.ui` scope in the consumer.

## Usage

Clearing returns focus to the trigger before the clear button becomes disabled. The picker retains its last browsed date anchor for reopening with an empty model; a selected model still determines the opening month. A native form reset does not synchronize Vue models, so the consumer must reset the model too.

```vue
<script setup lang="ts">
import { DatePicker } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const deliveryDate = ref('')
const open = ref(false)
</script>

<template>
  <div class="ui">
    <DatePicker
      v-model="deliveryDate"
      v-model:open="open"
      label="Delivery date"
      locale="en-US"
      initial-date="2026-09-01"
      placeholder="Choose a date"
      prev-label="Previous month"
      next-label="Next month"
      clear-label="Clear date"
      close-label="Close calendar"
      name="delivery-date"
      form="checkout-form"
    />
  </div>
</template>
```
