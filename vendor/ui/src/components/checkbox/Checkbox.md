---
title: Checkbox
designStatus: ai-draft
description: A labeled checkbox controlled by a boolean model.
model:
  type: boolean
  default: "false"
  description: Whether the checkbox is checked.
props:
  - name: label
    type: string
    required: true
    description: Text displayed beside the checkbox.
---

Checkbox pairs a native checkbox with its visible label. Bind the checked state as a boolean with `v-model`; do not pass `checked`, `true-value`, or `false-value` separately. The native `value` attribute is the form submission value and does not control checked state. Undeclared attributes such as `id`, `name`, `value`, `disabled`, `required`, ARIA attributes, and event listeners are applied to the inner input. `class` and `style` are applied to the outer label.

## Usage

```vue
<script setup lang="ts">
import { Checkbox } from '@froq/ui'
import { ref } from 'vue'

const accepted = ref(false)
</script>

<template>
  <div class="ui">
    <Checkbox
      v-model="accepted"
      label="Accept the terms"
    />
  </div>
</template>
```
