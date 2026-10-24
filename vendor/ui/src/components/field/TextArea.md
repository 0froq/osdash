---
title: TextArea
designStatus: ai-draft
description: A labeled multiline text field with configurable row count.
model:
  type: string
  default: "''"
  description: The current text value.
props:
  - name: label
    type: string
    required: true
    description: Visible text label for the textarea.
  - name: rows
    type: number
    default: "3"
    description: Number of visible text rows.
---

TextArea renders a labeled multiline text field. Bind its value with `v-model` and use `rows` to set its visible row count. Undeclared native attributes such as `id`, `name`, `disabled`, `required`, `readonly`, `placeholder`, ARIA attributes, and event listeners are applied to the inner textarea. `class` and `style` are applied to the outer label. Use `v-model` for the value instead of passing `value` separately.

## Usage

```vue
<script setup lang="ts">
import { TextArea } from '@froq/ui'
import { ref } from 'vue'

const note = ref('')
</script>

<template>
  <div class="ui">
    <TextArea
      v-model="note"
      label="Note"
      :rows="4"
    />
  </div>
</template>
```
