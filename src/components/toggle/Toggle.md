---
title: Toggle
designStatus: ai-draft
description: Two words share one switch. The control is only as wide as the word that is on.
model:
  type: boolean
  default: "false"
  description: Whether the switch is on.
props:
  - name: label
    type: string
    required: true
    description: Accessible name. It is not shown.
  - name: offLabel
    type: string
    default: "off"
    description: The word shown while the switch is off.
  - name: onLabel
    type: string
    default: "on"
    description: The word shown while the switch is on.
  - name: disabled
    type: boolean
    default: "false"
    description: Prevent user clicks from changing the switch.
---

Toggle is a switch made of two words. Only the active word is in the foreground, and the control's width follows that word, so the line does not reserve space for both at once. The accessible name is `label`. The visible words are `offLabel` and `onLabel`.

When `disabled` is true, the user cannot toggle the switch. A parent can still update the `v-model` value.

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
