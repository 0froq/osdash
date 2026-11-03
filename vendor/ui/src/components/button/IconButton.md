---
title: IconButton
designStatus: stable
description: An icon-only action button that swaps its glyph per state.
props:
  - name: label
    type: string
    required: true
    description: Accessible name, required since the content is only an icon.
  - name: type
    type: "'button' | 'submit' | 'reset'"
    default: button
    description: Native button type.
  - name: action
    type: '() => unknown | Promise<unknown>'
    description: Action to run on click. Resolve shows success, reject shows error.
  - name: resetAfter
    type: number
    default: '900'
    description: Milliseconds the result state stays before returning to idle.
  - name: frame
    type: boolean
    default: 'true'
    description: Draw the dashed frame. Bare icons read as clickable on their own.
events:
  - name: click
    description: Fired on activation.
slots:
  - name: icon
    description: Resting icon, usually the outline or linear variant.
  - name: iconHover
    description: Shown while hovered. Falls back to `icon`.
  - name: iconActive
    description: Shown while the action runs or after it succeeds. Falls back to `icon`.
  - name: iconError
    description: Shown after the action fails. Falls back to `icon`.
---

IconButton is a single action like `Button`, but its content is only an icon and its `label` is required for the accessible name. `frame` controls the dashed border — an icon that reads as clickable on its own can set it off for a bare glyph. Give `action` a function to get the same result feedback as `Button`: pending breathes, success settles on the success color, failure shakes on danger.

The icon is a stack of slots. The resting `icon` shows by default; `iconHover`, `iconActive`, and `iconError` swap in on hover, while working or succeeded, and on failure — each falling back to `icon` when not provided. Pass the same glyph in different weights (for example a linear `icon` and a bold `iconActive`) so a state change reads as the icon filling in rather than a layout jump.

## Usage

```vue
<script setup lang="ts">
import { IconButton } from '@froq/ui'
import '@froq/ui/tokens.css'
</script>

<template>
  <div class="ui">
    <IconButton
      label="Save bookmark"
      :action="save"
    >
      <template #icon>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M5 4h14v16l-7-4-7 4V4Z" />
        </svg>
      </template>
      <template #iconActive>
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M5 4h14v16l-7-4-7 4V4Z" />
        </svg>
      </template>
    </IconButton>
  </div>
</template>
```
