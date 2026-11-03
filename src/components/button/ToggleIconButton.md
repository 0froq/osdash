---
title: ToggleIconButton
designStatus: stable
description: An icon-only button that holds a pressed on/off state and swaps its glyph.
props:
  - name: label
    type: string
    required: true
    description: Accessible name, required since the content is only an icon.
  - name: type
    type: "'button' | 'submit' | 'reset'"
    default: button
    description: Native button type.
  - name: frame
    type: boolean
    default: 'true'
    description: Draw the dashed frame. Bare icons read as clickable on their own.
  - name: disabled
    type: boolean
    default: 'false'
    description: Disabled state.
model:
  name: default
  type: boolean
  default: 'false'
  description: Whether the button is pressed. Toggles on activation and sets `aria-pressed`.
slots:
  - name: icon
    description: Icon for the off state, usually the outline or linear variant.
  - name: iconOn
    description: Icon for the on state, usually the filled variant. Falls back to `icon`.
---

ToggleIconButton is the icon-only counterpart of `ToggleButton`: a held state, not a one-shot action. `label` is required for the accessible name. `frame` controls the dashed border — an icon that reads as clickable on its own can set it off for a bare glyph. Pressed, a framed button fills with a faint accent surface; a bare button just tints the glyph accent.

Pass the same glyph in different weights — an outline `icon` and a filled `iconOn` — so the state reads as the icon filling in rather than a layout jump. For a text version use `ToggleButton`; for a one-shot icon action use `IconButton`.

## Usage

```vue
<script setup lang="ts">
import { ToggleIconButton } from '@froq/ui'
import { ref } from 'vue'

const starred = ref(false)
</script>

<template>
  <div class="ui">
    <ToggleIconButton
      v-model="starred"
      label="Star"
    >
      <template #icon>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8L12 3Z" />
        </svg>
      </template>
      <template #iconOn>
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8L12 3Z" />
        </svg>
      </template>
    </ToggleIconButton>
  </div>
</template>
```
