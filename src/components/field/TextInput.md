---
title: TextInput
designStatus: ai-draft
description: A labeled single-line text field with a small set of input types.
model:
  type: string
  default: "''"
  description: The current input value.
props:
  - name: label
    type: string
    required: true
    description: Visible text label for the input.
  - name: type
    type: "'text' | 'email' | 'search'"
    default: text
    description: The native input type.
---

TextInput renders a labeled single-line input. Bind its value with `v-model`; `type` may be `text`, `email`, or `search`. Undeclared native attributes such as `id`, `name`, `disabled`, `required`, `readonly`, `placeholder`, ARIA attributes, and event listeners are applied to the inner input. `class` and `style` are applied to the outer label. Use `v-model` for the value instead of passing `value` separately.

## Usage

```vue
<script setup lang="ts">
import { TextInput } from '@froq/ui'
import { ref } from 'vue'

const email = ref('')
</script>

<template>
  <div class="ui">
    <TextInput
      v-model="email"
      label="Email"
      type="email"
      name="email"
      autocomplete="email"
      placeholder="you@example.com"
    />
  </div>
</template>
```
