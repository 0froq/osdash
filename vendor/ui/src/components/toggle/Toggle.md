---
title: Toggle
designStatus: stable
description: Two words share one switch. The control is only as wide as the word that is on.
model:
  type: boolean
  default: 'false'
  description: Whether the switch is on.
props:
  - name: label
    type: string
    required: true
    description: Accessible name. It is not shown.
  - name: offLabel
    type: string
    default: 'off'
    description: The word shown while the switch is off.
  - name: onLabel
    type: string
    default: 'on'
    description: The word shown while the switch is on.
  - name: disabled
    type: boolean
    default: 'false'
    description: Prevent user clicks from changing the switch.
slots:
  - name: off
    description: Replaces the `offLabel` word while the switch is off. Use it for an icon or other markup.
  - name: on
    description: Replaces the `onLabel` word while the switch is on. Use it for an icon or other markup.
---

Toggle is a switch made of two words. Only the active word is in the foreground, and the control's width follows that word, so the line does not reserve space for both at once. The accessible name is `label`. The visible words are `offLabel` and `onLabel`.

When `disabled` is true, the user cannot toggle the switch. A parent can still update the `v-model` value.

The `off` and `on` slots replace the words, for example with icons. They keep the same roll and the same width rule: the control is as wide as the content that is on. An icon has no text of its own, so `label` is the only accessible name. Mark decorative icons `aria-hidden`. An `svg` in a slot is sized to `1em`, so it follows the font size of the line. Set a size on the icon to change that.

## Usage

```vue
<script setup lang="ts">
import { Toggle } from '@froq/ui'
import { ref } from 'vue'

const aloud = ref(false)
</script>

<template>
  <p class="ui">
    Read it
    <Toggle
      v-model="aloud"
      label="sound"
      off-label="quiet"
      on-label="aloud"
    />.
  </p>
</template>
```

With icons:

```vue
<Toggle v-model="dark" label="Color theme">
  <template #off>
    <SunIcon aria-hidden="true" />
  </template>
  <template #on>
    <MoonIcon aria-hidden="true" />
  </template>
</Toggle>
```
