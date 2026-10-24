---
title: Separator
designStatus: ai-draft
description: A visual divider or semantic separator between content.
props:
  - name: orientation
    type: "'horizontal' | 'vertical'"
    default: horizontal
    description: Divider direction. A vertical separator stretches to the parent's height.
  - name: decorative
    type: boolean
    default: "true"
    description: Uses presentation semantics when true; otherwise exposes a separator with its orientation.
---

Separator renders a divider. By default it is horizontal and decorative, with `role="presentation"`. Set `decorative="false"` to expose `role="separator"` and the selected `aria-orientation`. It does not move or manage focus.

For a vertical separator, the parent layout must provide a height for it to stretch across. The component has no slots or `v-model`. Styles use the UI library tokens and do not depend on fonts, routes, or business state. Import `style.css` in the caller and place the component inside an element with `class="ui"`.

## Usage

```vue
<script setup lang="ts">
import { Separator } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <span>Editorial</span>
    <Separator />
    <div style="display: flex; height: 2rem; align-items: center; gap: 1rem">
      <span>Notes</span>
      <Separator orientation="vertical" />
      <span>Archive</span>
    </div>
  </div>
</template>
```
