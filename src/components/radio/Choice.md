---
title: Choice
designStatus: ai-draft
description: A row of words. The chosen word keeps an accent stop, and the stop travels.
model:
  type: T
  required: true
  description: The value of the chosen option.
props:
  - name: options
    type: "ChoiceOption<T>[]"
    required: true
    description: The words. Each option has a value and a label, and may be disabled.
  - name: label
    type: string
    description: Visible label that names the group.
  - name: disabled
    type: boolean
    default: "false"
    description: Disable the entire group.
---

Choice is one selection among words, not a stack of boxes. The chosen word sits in the foreground. The others stay muted. An accent stop rests just after the chosen word and moves when the selection changes. If the reader prefers reduced motion, the stop jumps instead of traveling.

The custom button radio group is a single tab stop. Arrow keys, Home, and End move the selection; disabled options are skipped. Modified keys are not consumed. If the current value is missing or disabled, the first enabled option becomes the Tab entry point without changing the model. When every option is disabled, none is tabbable. The `disabled` prop disables the whole group.

Choice does not submit a native form value: `v-model` is not a `name` field, and the component does not provide native `required` or `name` behavior. If a form needs a submitted value, provide a hidden input in the consuming application.

## Usage

```vue
<script setup lang="ts">
import { Choice } from '@froq/ui'
import { ref } from 'vue'

const tone = ref('plain')
const options = [
  { value: 'quiet', label: 'quiet' },
  { value: 'plain', label: 'plain' },
  { value: 'loud', label: 'loud' },
]
</script>

<template>
  <div class="ui">
    <Choice
      v-model="tone"
      label="Tone"
      :options="options"
    />
  </div>
</template>
```
