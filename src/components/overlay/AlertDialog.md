---
title: AlertDialog
designStatus: ai-draft
description: A modal confirmation dialog with explicit confirm and cancel actions.
model:
  type: boolean
  default: "false"
  description: Whether the dialog is open. Supports v-model.
props:
  - name: title
    type: string
    required: true
    description: Visible dialog title.
  - name: description
    type: string
    required: true
    description: Visible dialog description.
  - name: cancelLabel
    type: string
    required: true
    description: Visible label for the cancel button.
  - name: confirmLabel
    type: string
    required: true
    description: Visible label for the confirm button.
  - name: triggerLabel
    type: string
    description: Trigger text when no trigger slot is provided; defaults to title.
  - name: disabled
    type: boolean
    default: "false"
    description: Disables the trigger only. A parent can still open the dialog through the model.
  - name: pending
    type: boolean
    default: "false"
    description: Disables confirmation and sets aria-busy on the content. Cancel and Escape remain available.
  - name: confirmDisabled
    type: boolean
    default: "false"
    description: Disables the confirm button independently of pending.
  - name: portalTo
    type: string | HTMLElement
    description: Teleport target. Defaults to the closest consumer element with class ui, or renders inline when none exists.
events:
  - name: confirm
    payload: MouseEvent
    description: Emitted synchronously when confirmation is activated and allowed. Prevent the event default before returning to keep the dialog open.
slots:
  - name: trigger
    description: Optional single button child, or a button component forwarding the trigger attributes and listeners.
  - name: default
    description: Optional dialog body content. The footer is fixed and is not exposed as a slot.
---

AlertDialog is a modal confirmation dialog with required `title`, `description`, `cancelLabel`, and `confirmLabel`. Its boolean `v-model` defaults to `false`. Without a trigger slot, `triggerLabel` defaults to `title`. The optional trigger slot must resolve to one real button; a button component used there must forward the attributes and listeners it receives. `disabled` affects only that trigger, so the parent can still open the dialog through `v-model`.

The dialog has a built-in Cancel button and no close icon. Reka UI places initial focus on Cancel. Cancel and Escape close the dialog; outside interaction is blocked. Closing unmounts the dialog content. The optional default slot adds body content between the description and the fixed footer; there is no footer override slot.

When confirmation is activated and neither `pending` nor `confirmDisabled` blocks it, the component emits `confirm` with the original `MouseEvent` synchronously. If the event is not prevented by the time the handler returns, the dialog closes. Use `@confirm.prevent` when starting asynchronous work: Vue prevents the event synchronously, so the dialog stays open while the request runs. The consumer owns request state, success, errors and cancellation; the component does not await a promise or claim that the action succeeded. On success, close it by setting the `v-model` to `false`.

`pending` sets `aria-busy` on the content and disables only the confirm button. Cancel and Escape remain available, so pending does not lock the request or prevent cancellation. `confirmDisabled` disables confirmation without marking the content busy.

Undeclared attributes are forwarded to the content, not the trigger or outer scope. By default, content portals into the closest consumer element with `class="ui"`; if there is none, it renders inline on the client. During SSR, the trigger renders but portal content does not. A custom `portalTo` target must already exist and provide the consumer's theme and UI tokens. The component root does not add the `.ui` class. Import `style.css` in the caller and provide a `.ui` ancestor for library styles and the default portal target.

## Usage

```vue
<script setup lang="ts">
import { AlertDialog, Button } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)
const confirmed = ref(false)

function confirm() {
  confirmed.value = true
}
</script>

<template>
  <div class="ui">
    <AlertDialog
      v-model="open"
      title="Delete draft?"
      description="This action cannot be undone."
      cancel-label="Cancel"
      confirm-label="Delete"
      @confirm="confirm"
    >
      <template #trigger>
        <Button>Delete draft</Button>
      </template>
      <p>Delete the current draft?</p>
    </AlertDialog>
    <p v-if="confirmed">
      Deletion confirmed in this example; no request was sent.
    </p>
  </div>
</template>
```
