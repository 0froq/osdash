---
title: CopyButton
designStatus: ai-draft
description: A button that copies text and reports its clipboard state.
props:
  - name: text
    type: string
    required: true
    description: Text written to the clipboard when clicked.
  - name: label
    type: string
    required: true
    description: Accessible label shown in the idle state.
  - name: copiedLabel
    type: string
    required: true
    description: Accessible label shown after a successful copy.
  - name: errorLabel
    type: string
    required: true
    description: Accessible label shown when copying fails.
  - name: pendingLabel
    type: string
    default: label
    description: Accessible label shown while copying; defaults to label.
  - name: resetAfter
    type: number
    default: "1600"
    description: Delay in milliseconds before a copied or error state returns to idle. A non-positive or non-finite value keeps the result until the next click.
  - name: disabled
    type: boolean
    default: "false"
    description: Disables copying. The button is also disabled while a copy is pending.
events:
  - name: copy
    payload: string
    description: Emitted with the exact text successfully written to the clipboard at click time.
  - name: error
    payload: Error
    description: Emitted when clipboard writing fails.
---

CopyButton copies the `text` prop after a user click and presents idle, pending, copied, and error labels in the same grid cell. The cell keeps the width of its widest label without measuring text in JavaScript. While a request is pending, the button is disabled to prevent concurrent copies. Unsupported clipboard APIs and permission failures produce the error state and `error` event; they do not count as a copy.

The reset delay is captured when the write finishes; changing `resetAfter` does not retime an existing result. Positive finite delays are scheduled in bounded chunks to avoid native timer overflow. Actual callbacks can run later when the browser throttles a background page. Starting another copy or disposing the scope cancels the pending reset.

The component uses a native button and forwards undeclared attributes to it. Its `type` is fixed to `button`; `aria-label` and `aria-busy` are managed from the current state. It has no slot and does not add the `.ui` scope class. Import `style.css` in the caller and put the component inside an element with `class="ui"`.

Clipboard writing must happen directly from a user gesture and is available only in a secure context, such as HTTPS or localhost. See [MDN: Clipboard.writeText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText).

## Usage

```vue
<script setup lang="ts">
import { CopyButton } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <CopyButton
      text="pnpm dev"
      label="Copy command"
      pending-label="Copying command"
      copied-label="Command copied"
      error-label="Could not copy"
      :reset-after="1600"
      :disabled="false"
      @copy="text => console.info('Copied:', text)"
      @error="error => console.error(error)"
    />
  </div>
</template>
```

For clipboard state without this component, `useClipboard(text, resetAfter?)` from `@froq/ui/vue` returns `{ status, error, copy }`. Call `copy()` directly in a user gesture; it resolves to `{ ok: true, text }` or `{ ok: false, error }`. It returns `undefined` if another write is pending or the scope has been disposed. The composable must be used within a Vue setup/effect scope.
