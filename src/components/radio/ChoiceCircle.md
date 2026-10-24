---
title: ChoiceCircle
designStatus: ai-draft
description: The same choice as Choice, with a loose ring drawn around the chosen word.
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
    description: Accessible name for the group; it is not displayed.
  - name: disabled
    type: boolean
    default: "false"
    description: Disable the entire group.
---

ChoiceCircle is the same single choice as Choice. Instead of a stop after the word, a loose ellipse is drawn around it. Each change draws the ring again. Reduced motion skips the drawing and shows the ring at rest.

Keyboard behavior matches Choice: the custom button radio group is a single tab stop; arrow keys, Home, and End move the selection while skipping disabled options. Modified keys are not consumed. If the current value is missing or disabled, the first enabled option becomes the Tab entry point without changing the model; when every option is disabled, none is tabbable. The `disabled` prop disables the whole group.

ChoiceCircle does not submit a native form value: `v-model` is not a `name` field, and the component does not provide native `required` or `name` behavior. If a form needs a submitted value, provide a hidden input in the consuming application.

## Usage

```vue
<script setup lang="ts">
import { ChoiceCircle } from '@froq/ui'
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
    <ChoiceCircle
      v-model="tone"
      label="Tone"
      :options="options"
    />
  </div>
</template>
```
