---
title: Slider
designStatus: ai-draft
description: A labeled native single-thumb range input.
model:
  type: number
  default: "50"
  description: The controlled slider value. Displayed values are clamped to the normalized bounds.
props:
  - name: label
    type: string
    required: true
    description: Visible text label for the range input.
  - name: min
    type: number
    default: "0"
    description: Minimum bound. A non-finite value falls back to zero.
  - name: max
    type: number
    default: "100"
    description: Maximum bound. A non-finite value falls back to the greater of min and 100; a finite value below min is normalized to min.
  - name: step
    type: number | 'any'
    default: "1"
    description: Native range step. A non-finite or non-positive number falls back to 1; any disables step granularity.
---

Slider wraps a native `<input type="range">` with one thumb. It does not provide a two-thumb range. Bind the numeric value with `v-model`; the default is 50. Finite displayed values are clamped to the normalized bounds, while a non-finite model value displays the midpoint. The browser applies native step alignment. The component does not rewrite an externally supplied out-of-range or off-step model value until the user changes the input; input events update the model from `valueAsNumber`.

`min` defaults to 0 and a non-finite value becomes 0. `max` defaults to 100; a non-finite value becomes the greater of normalized `min` and 100, and a finite value below `min` becomes `min`. `step` defaults to 1; non-finite or non-positive numeric values become 1. Set `step="any"` to allow any native range value.

`class` and `style` apply to the outer label. Other undeclared native attributes, including `name`, `disabled`, and `aria-valuetext`, are forwarded to the input. Native range inputs do not support `readonly`. Resetting the surrounding form does not automatically reset the Vue model.

The component has no slots. Its styles use the UI library tokens and do not depend on fonts, routes, or business state. Import `style.css` in the caller and place the component inside an element with `class="ui"`.

## Usage

```vue
<script setup lang="ts">
import { Slider } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const volume = ref(50)
</script>

<template>
  <div class="ui">
    <Slider
      v-model="volume"
      label="Volume"
      :min="0"
      :max="100"
      :step="5"
      :aria-valuetext="`${volume} percent`"
    />
  </div>
</template>
```
