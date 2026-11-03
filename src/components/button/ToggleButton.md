---
title: ToggleButton
designStatus: stable
description: A button that holds a pressed on/off state.
props:
  - name: type
    type: "'button' | 'submit' | 'reset'"
    default: button
    description: Native button type.
  - name: disabled
    type: boolean
    default: 'false'
    description: Disabled state.
  - name: label
    type: string
    description: Accessible name. Omit when the default slot carries text.
model:
  name: default
  type: boolean
  default: 'false'
  description: Whether the button is pressed. Toggles on activation and sets `aria-pressed`.
slots:
  - name: default
    description: Content shown in both states.
  - name: off
    description: Content shown only while not pressed. Pair it with `on`.
  - name: on
    description: Content shown only while pressed. Pair it with `off`.
---

ToggleButton is a state, not an action. Activating it flips a boolean the caller owns through `v-model` and announces itself with `aria-pressed`. The frame is the same dashed-to-solid language as `Button`; pressed, the surface fills with a faint accent tint. Provide `off` and `on` slots to swap the word between states (they share one grid cell so the button keeps a stable width), or a single default slot for a label that does not change.

For a one-shot action use `Button`; for an icon-only version of this state use `ToggleIconButton`; for a group of related options use `ToggleGroup`.

## Usage

```vue
<script setup lang="ts">
import { ToggleButton } from '@froq/ui'
import { ref } from 'vue'

const bold = ref(false)
</script>

<template>
  <div class="ui">
    <ToggleButton v-model="bold">
      <strong>B</strong>
    </ToggleButton>
    <ToggleButton v-model="bold">
      <template #off> Notify off </template>
      <template #on> Notify on </template>
    </ToggleButton>
  </div>
</template>
```
