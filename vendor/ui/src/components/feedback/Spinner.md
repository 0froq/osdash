---
title: Spinner
designStatus: ai-draft
description: An animated status indicator for ongoing work.
props:
  - name: label
    type: string
    required: true
    description: Accessible name for the status indicator.
---

Spinner renders a status region with the required accessible `label`. Set `font-size` on the component or an ancestor to control its size; the ring uses the current text size. Reduced-motion preferences stop the ring animation.

The component has no `v-model` or slots. Its styles use the UI library tokens and do not depend on fonts, routes, or business state. Import `style.css` in the caller and place the component inside an element with `class="ui"`.

## Usage

```vue
<script setup lang="ts">
import { Spinner } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <Spinner
      label="Loading results"
      style="font-size: 1.25rem"
    />
  </div>
</template>
```
