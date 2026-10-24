---
title: DateInput
designStatus: ai-draft
description: A labeled native date input with a date-only string model.
model:
  type: string
  default: "''"
  description: The date-only value in YYYY-MM-DD format, or an empty string.
props:
  - name: label
    type: string
    required: true
    description: Visible text label for the input.
---

DateInput renders a labeled native `type="date"` control. Its model is a date-only string in `YYYY-MM-DD` format; it does not convert the value to a UTC `Date`. Browser-localized display and the date-picker interface are provided by the browser. This is not a library date picker and it has no callback for disabling individual dates.

Undeclared native attributes and listeners, including `min`, `max`, `step`, `name`, `disabled`, `readonly`, and `required`, are applied to the input. `class` and `style` are applied to the outer label. An `@input` listener receives the native `Event`. The component has no custom events or slots.

## Usage

```vue
<script setup lang="ts">
import { DateInput } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const date = ref('2026-09-30')
</script>

<template>
  <div class="ui">
    <DateInput
      v-model="date"
      label="Start date"
      name="start-date"
      min="2026-01-01"
      required
    />
  </div>
</template>
```
