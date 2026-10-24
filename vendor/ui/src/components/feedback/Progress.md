---
title: Progress
designStatus: ai-draft
description: A native progress indicator with determinate and indeterminate states.
props:
  - name: label
    type: string
    required: true
    description: Accessible name applied to the native progress element.
  - name: value
    type: number
    description: Current progress. Omit it or pass a non-finite number for indeterminate progress; finite values are clamped between zero and max.
  - name: max
    type: number
    default: "100"
    description: Upper bound for progress. Non-finite or non-positive values fall back to 100.
---

Progress renders a native `<progress>` element and applies `label` as its `aria-label`. A finite `value` is clamped to the range from zero to the normalized `max`. When `value` is omitted or non-finite, the native element is indeterminate. An invalid `max` is normalized to 100.

The component has no `v-model` or slots. Its styles use the UI library tokens and do not depend on fonts, routes, or business state. Import `style.css` in the caller and place the component inside an element with `class="ui"`.

## Usage

```vue
<script setup lang="ts">
import { Progress } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <Progress
      label="Uploading files"
      :value="3"
      :max="5"
    />
    <Progress label="Loading results" />
  </div>
</template>
```
