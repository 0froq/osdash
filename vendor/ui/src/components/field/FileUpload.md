---
title: FileUpload
designStatus: ai-draft
description: A labeled native file input that reports selected files.
props:
  - name: label
    type: string
    required: true
    description: Visible text label for the native file input.
  - name: resetKey
    type: string | number
    description: Clearing key. Changing its value clears the native input and emits change with an empty file list.
events:
  - name: change
    payload: File[]
    description: Emitted when the native input changes, with its selected files; clear operations emit an empty array.
  - name: cancel
    payload: Event
    description: Native cancel event forwarded to the file input. It is not treated as a change with an empty file list.
---

FileUpload renders a native file input with a visible `label`. It has no `v-model`; listen for the component `change` event to receive a `File[]`. The `clear()` method is exposed on the component instance. Changing `resetKey` or calling `clear()` empties the native input and emits `change` with `[]`.

Native file input attributes such as `accept`, `multiple`, `capture`, `name`, `required`, and `disabled` are forwarded to the input. `class` and `style` apply to the outer label. The input type is fixed to `file`; do not pass `value`. Browsers do not allow JavaScript to prefill a file input. `accept` is a picker hint, not file validation. FileUpload does not upload files or retain them in application state. Keep selected files in the consumer and synchronize that state when clearing or resetting the form. A native `cancel` event is forwarded and is distinct from an empty `change` event.

The component has no slots. Its styles use the UI library tokens and do not depend on fonts, routes, or business state. Import `style.css` in the caller and place the component inside an element with `class="ui"`.

## Usage

```vue
<script setup lang="ts">
import { FileUpload } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const resetKey = ref(0)
const files = ref<File[]>([])

function handleCancel() {
  console.info('File picker canceled')
}
</script>

<template>
  <div class="ui">
    <FileUpload
      label="Attachments"
      accept="image/*"
      multiple
      :reset-key="resetKey"
      @change="files = $event"
      @cancel="handleCancel"
    />
    <button
      type="button"
      @click="resetKey++"
    >
      Clear selection
    </button>
    <p>{{ files.length }} files selected</p>
  </div>
</template>
```
