---
title: NumberInput
designStatus: ai-draft
description: A labeled native number input with an optional numeric model.
model:
  type: number | undefined
  description: The finite numeric value, or undefined when the input is empty or cannot be parsed as a finite number.
props:
  - name: label
    type: string
    required: true
    description: Visible text label for the input.
  - name: min
    type: number
    description: Native minimum constraint.
  - name: max
    type: number
    description: Native maximum constraint.
  - name: step
    type: "number | 'any'"
    default: browser default (1)
    description: Native step constraint; the browser default is 1.
---

NumberInput renders a labeled native `type="number"` control. Its model has no initial value unless the caller supplies one; an empty input or a non-finite parsed value updates the model to `undefined`. A finite value supplied by the parent is displayed as-is and is not clamped to `min` or `max`. These props set native browser constraints; they are not application-level validation. The component does not provide currency precision or phone-number semantics.

Undeclared native attributes and listeners are applied to the input, while `class` and `style` are applied to the outer label. The component controls the input `type` and `value`; do not pass `value` separately. An `@input` listener receives the native `Event`. Resetting a native form does not update the Vue model, so the consumer must reset its state too.

## Usage

```vue
<script setup lang="ts">
import { NumberInput } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const quantity = ref<number | undefined>()
</script>

<template>
  <div class="ui">
    <NumberInput
      v-model="quantity"
      label="Quantity"
      :min="0"
      :max="20"
      :step="1"
      name="quantity"
      @input="(event: Event) => console.info(event)"
    />
  </div>
</template>
```
