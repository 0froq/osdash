---
title: ScrollSelect
designStatus: ai-draft
description: A compact single-value picker for short lists, stepped by wheel or arrow keys.
model:
  type: string
  required: true
  description: The value of the selected option. It must equal one option's value; an unmatched value shows the first option.
props:
  - name: label
    type: string
    required: true
    description: Visible text label and accessible name for the control.
  - name: options
    type: ChoiceOption[]
    required: true
    description: Options with a string value, display label, and optional disabled state.
  - name: hideLabel
    type: boolean
    default: 'false'
    description: Hide the visible label while retaining an accessible name.
  - name: disabled
    type: boolean
    description: Disable the control.
  - name: name
    type: string
    description: Form field name. Renders a hidden input that submits the current value.
  - name: pending
    type: boolean
    default: 'false'
    description: Hold changes while the consumer applies the last one, such as a route change. The list snaps back to the model when pending ends.
  - name: wheel
    type: hover | focus | off
    default: focus
    description: When the wheel changes the value. `focus` requires focus inside the control; `hover` also changes it while the pointer is over the control and keeps the page still. `off` disables wheel changes.
slots:
  - name: option
    description: Receives `{ option }`. Decorates the collapsed rows, the open list, and the hidden width sizer. Keep `option.label` as the plain-text value.
---

ScrollSelect is a compact picker for short lists of about seven options or fewer. At rest it shows the current word with the rows above and below it, each showing half a row and faded at the edge. Click or Enter opens the list, which keeps its top edge and grows downward. The model is a required string that must equal one option's value. Use Select or Combobox for long lists; ScrollSelect has no typeahead and no touch swipe.

## Usage

```vue
<script setup lang="ts">
import { ScrollSelect } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/tokens.css'

const options = [
  { value: 'quiet', label: 'Quiet' },
  { value: 'plain', label: 'Plain' },
  { value: 'loud', label: 'Loud' },
]
const tone = ref('plain')
</script>

<template>
  <div class="ui">
    <ScrollSelect
      v-model="tone"
      label="Tone"
      :options="options"
    />
  </div>
</template>
```

## Presentation

The neighbouring rows show through at half height, faded at the top and bottom edges, which marks the control as a picker. Words are flush at the start edge, collapsed and open, so opening the list moves nothing sideways. The current option is shown in `--ui-fg` while the others are `--ui-muted`. While the list is open its row also takes a `--ui-fg` 6% band across its full width and the Sidebar's accent capsule down the leading edge, the same fill the Sidebar uses, so the selection is never colour alone. A hovered or focused option is underlined, 1px with a 4px offset, as in the other lists.

`--ui-accent` against `--ui-bg` is a low-contrast pair at this size. Do not rely on the accent to tell options apart.

## Interaction

Wheel or ArrowUp/ArrowDown on the trigger moves exactly one option per gesture, however far, fast or long the wheel scrolls, and updates the model at once. A gesture ends on a pause, a reversal, or a fresh swipe, and nothing else ends it, so one long scroll is never several steps. To move again, pause, reverse, or swipe again. While `pending` is true the wheel does nothing, and the rest of that gesture is not retried when `pending` ends. The `wheel` prop controls when the wheel acts: `focus` requires focus inside the control, `hover` also acts under the pointer and keeps the page still, and `off` disables it. Disabled options are skipped and cannot be picked. On touch, a tap opens the list; `touch-action: none` keeps the page from scrolling from the control. Reduced motion disables transitions.

`pending` holds the collapsed window on the row the user moved to while the consumer applies the change, such as a route change. When `pending` ends, the window snaps back to the row matching the model.

Pass `name` to submit the value with a form; the component renders a hidden input, which is disabled when the control is disabled. Keep lists short. For long or searchable lists use Select or Combobox.
