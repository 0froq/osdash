---
title: ToggleGroup
designStatus: ai-draft
description: A labeled group of single or multiple toggle buttons.
model:
  type: string | string[]
  default: "''"
  description: A string in single mode or an array of strings in multiple mode.
props:
  - name: label
    type: string
    required: true
    description: Visible label used to name the group.
  - name: options
    type: ChoiceOption[]
    required: true
    description: Options with unique, non-empty values, labels, and optional disabled state.
  - name: type
    type: "'single' | 'multiple'"
    default: single
    description: Whether one or multiple options can be active.
  - name: orientation
    type: "'horizontal' | 'vertical'"
    default: horizontal
    description: Group orientation used for arrow-key focus movement.
  - name: dir
    type: "'ltr' | 'rtl'"
    description: Reading and keyboard direction; defaults to the Reka UI direction context, then ltr.
  - name: loop
    type: boolean
    default: "true"
    description: Loop arrow-key focus movement from the last enabled item to the first, and back.
  - name: disabled
    type: boolean
    default: "false"
    description: Disable the entire group.
slots:
  - name: option
    description: Receives option and active to replace its label; do not add interactive descendants.
---

ToggleGroup renders a visible label and a button group named by that label. In single mode, the model is a string; an empty string means no active option. In multiple mode, the model is a string array, and an empty array means none are active. Option values must be unique and non-empty because the empty string is used to clear single selection.

A narrow TypeScript single-value model must include `''`, for example `ref<'' | 'left' | 'right'>('left')`. Multiple-value models use arrays, whose empty array already represents clearing. Keep supplied option values compatible with your consumer model; the generic does not validate remote option data.

The component adapts the supplied model shape for display without rewriting the parent's value: a string is viewed as one selected value in multiple mode, and an array is viewed by its first value in single mode. Unknown values and values for disabled options are not pruned or corrected automatically. User selection writes back the shape for the current `type`: a string or empty string in single mode, and an array in multiple mode.

The group has `role="group"` and uses its visible label as its accessible name. Each option is a button with `aria-pressed`. Disabled options and a disabled group use Reka UI's native disabled handling. Arrow keys move focus according to `orientation`, Home and End move to the first and last enabled item, and `loop` controls wrapping. Horizontal arrow behavior follows RTL direction. Space and Enter toggle the focused item. The `option` slot replaces only the button label, so its content must not contain interactive descendants. This is not a tabs widget or a native radio group with required-radio validation; use `RadioGroup` when native radio form behavior is needed.

`class` and `style` are applied to the outer field wrapper. Other undeclared attributes are applied to the Reka group root, not to individual option buttons.

## Usage

```vue
<script setup lang="ts">
import { ToggleGroup } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const alignment = ref('left')
const emphasis = ref<string[]>(['italic'])
const alignments = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
]
const emphasisOptions = [
  { value: 'italic', label: 'Italic' },
  { value: 'underline', label: 'Underline' },
  { value: 'strike', label: 'Strike', disabled: true },
]
</script>

<template>
  <div class="ui">
    <ToggleGroup
      v-model="alignment"
      label="Alignment"
      :options="alignments"
    />
    <ToggleGroup
      v-model="emphasis"
      type="multiple"
      label="Emphasis"
      :options="emphasisOptions"
    />
  </div>
</template>
```
