---
title: Select
designStatus: ai-draft
description: A single-value select with native and custom presentations.
model:
  type: string
  required: true
  description: The value of the selected option.
props:
  - name: native
    type: boolean
    default: "true"
    description: Use the native select; false enables the compact custom listbox.
  - name: hideLabel
    type: boolean
    default: "false"
    description: Hide the visible label while retaining an accessible name.
  - name: accent
    type: string
    description: Optional CSS color overriding --ui-accent within this control.
  - name: align
    type: start | center | end
    default: start
    description: Alignment of the custom dropdown relative to its trigger.
  - name: disabled
    type: boolean
    description: Disable the control in either mode.
  - name: required
    type: boolean
    description: Require a value when used in a form.
  - name: name
    type: string
    description: Form field name in either mode.
  - name: framed
    type: boolean
    default: "false"
    description: Full outline and token background; inherits the host font.
  - name: label
    type: string
    required: true
    description: Visible text label for the select.
  - name: options
    type: ChoiceOption[]
    required: true
    description: Options with a string value, display label, and optional disabled state.
---

Select defaults to the native control for backward compatibility. Set `:native="false"` for a custom accessible combobox/listbox. Pass options as `{ value, label, disabled? }` and bind a string with `v-model`. `disabled`, `required`, and `name` work in both modes. Other attributes and event listeners go to the native select or custom trigger; `class` and `style` go to the outer container. This is single-value only; use `v-model`, not `value` or `multiple`.

## Usage

```vue
<script setup lang="ts">
import { Select } from '@froq/ui'
import { ref } from 'vue'

const options = [
  { value: 'quiet', label: 'Quiet' },
  { value: 'plain', label: 'Plain' },
]
const tone = ref('plain')
</script>

<template>
  <div class="ui">
    <Select
      v-model="tone"
      label="Tone"
      :options="options"
    />
  </div>
</template>
```

## Presentation

The native control has a shared chevron inset 12 px from the right; 34 px of control padding reserves space for it. The chevron ignores pointer events, so native mouse, keyboard, touch and assistive-technology behavior remains on the select. Set optional `framed` (boolean, default false) for a full outline and token background; the framed control inherits its host font. The default keeps the understated underline. Both presentations read only the existing UI token contract.

The custom trigger is borderless unless `framed` is set. Its dropdown has a straight outline, no shadow, and compact rows without gaps. Hover uses a faint accent tint; the selected row uses a solid accent and `--ui-bg` text. Selection is independent of disabled state. Arrow keys, typeahead, Enter/Space, Escape, and outside dismissal are handled by Reka UI. The dropdown stays inside the control's token scope, including when portaled. Reduced-motion preferences disable the trigger's color transition.

```vue
<Select
  v-model="tone"
  :native="false"
  :options="options"
  label="Tone"
  hide-label
  accent="oklch(65% 0.16 145)"
/>
```

`accent` is assigned directly to `--ui-accent`: HEX (including alpha), named colors, `rgb()`, `hsl()`, `oklch()`, `color(display-p3 ...)`, and `var(--brand-color)` work when supported by the browser. There is no HEX-only parsing or JavaScript conversion. Omit it to inherit the consumer's accent. Choose an accent with sufficient contrast against `--ui-bg`; this API does not automatically adjust contrast or opacity.

The custom-only `option` slot receives `{ option }` to decorate option text (for example its `lang` attribute). Keep `option.label` as the plain-text name used for keyboard search and the selected value. No trigger slot is needed for the standard presentation.
