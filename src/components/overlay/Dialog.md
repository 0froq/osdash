---
title: Dialog
designStatus: ai-draft
description: A modal dialog with controlled open state and configurable dismissal.
model:
  type: boolean
  default: "false"
  description: Whether the dialog is open.
props:
  - name: title
    type: string
    required: true
    description: Visible dialog title.
  - name: closeLabel
    type: string
    required: true
    description: Accessible name for the built-in close button.
  - name: description
    type: string
    description: Optional visible description associated with the dialog.
  - name: triggerLabel
    type: string
    default: title
    description: Trigger text when no trigger slot is provided; defaults to title.
  - name: showTrigger
    type: boolean
    default: "true"
    description: Render the built-in trigger and trigger slot. When false, neither is rendered.
  - name: returnFocus
    type: HTMLElement
    description: Optional focusable element to receive focus when the dialog closes; takes precedence over the captured opener.
  - name: disabled
    type: boolean
    default: "false"
    description: Disable the trigger. A parent can still open the dialog through the model.
  - name: dismissible
    type: boolean
    default: "true"
    description: Show the built-in close button and allow Escape or outside dismissal.
  - name: closeOnOutside
    type: boolean
    default: "true"
    description: Allow outside interaction to close the dialog when dismissible is true.
  - name: portalTo
    type: "string | HTMLElement"
    description: Teleport destination. Defaults to the nearest ancestor with class ui; without one, content renders inline on the client.
slots:
  - name: trigger
    description: Optional single button child; use a native button or a component that forwards attrs and its button ref.
  - name: default
    description: Dialog body; receives close() and is unmounted when the dialog closes.
  - name: footer
    description: Optional footer content; receives close().
events:
  - name: openAutoFocus
    payload: Event
    description: Synchronous cancelable event on dialog opening before default focus moves.
  - name: closeAutoFocus
    payload: Event
    description: Synchronous cancelable event on dialog closing; preventDefault() to manage focus yourself.
---

Dialog uses a controlled boolean `v-model`, initially closed, and supports externally controlled modal workflows with multiple entries. It provides modal focus trapping, layering, and Escape handling through Reka UI. With the default `showTrigger="true"`, Reka's built-in trigger supplies the default focus-return target; `disabled` only disables that built-in trigger, so callers must disable external controls themselves. Set `showTrigger="false"` when using external entries; neither the built-in trigger nor trigger slot is rendered. In this mode the component captures a non-`body` active element at the layer's `openAutoFocus` event, before default focus moves—not on every possible opening action. If the caller moves focus into content before that event, pass `returnFocus` explicitly. It must be a focusable `HTMLElement`; the component does not add `tabindex` to ordinary elements.

With `showTrigger="false"`, focus restoration uses a valid `returnFocus` target first, then the captured opener. A target is usable only when connected, not disabled, hidden, or inert, and has layout. If neither is usable, the component does not guess a page-level fallback. With the built-in trigger shown, Reka UI handles its default focus return. The declared `openAutoFocus` and `closeAutoFocus` events are synchronous and receive the cancelable DOM `Event`; call `preventDefault()` synchronously. Use `@close-auto-focus.prevent` to take over focus restoration when the external candidates are inappropriate. `dismissible` controls the built-in close button and Escape/outside dismissal. With `dismissible="false"`, `closeOnOutside` has no effect. When dismissible is true, setting `closeOnOutside="false"` prevents outside dismissal while leaving the close button and Escape available. Slot `close()` and parent model updates can always close the dialog.

Undeclared attributes are bound to the Reka `DialogContent`, not to the trigger or the outer scope. When `description` is absent, the component removes `aria-describedby` from those forwarded attributes so the dialog has no stale description reference. Use the trigger slot only with one native button or a component that truly forwards the supplied attributes and button ref; do not use a `div` or link as a pretend button.

By default, the dialog portals into the nearest consumer ancestor with class `.ui`. If no such target exists, it renders inline on the client. During SSR, the built-in trigger renders only when `showTrigger` is true; portal content does not render. A custom `portalTo` target must exist and provide the consumer's design tokens and theme. The Dialog root does not add `.ui`; the consuming application must provide the scope and any portal destination styling.

The body and footer slots receive `close()`. Reka's default close behavior unmounts dialog content, so persist any state that should survive closing in the consumer. Dialog has no alert-dialog semantics or asynchronous confirmation/business logic.

## Usage

```vue
<script setup lang="ts">
import { Dialog } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)
</script>

<template>
  <div class="ui">
    <Dialog
      v-model="open"
      title="Document details"
      description="Review the current draft."
      close-label="Close dialog"
      trigger-label="View draft"
    >
      <template #default="{ close }">
        <p>Draft details are supplied by the caller.</p>
        <button
          type="button"
          @click="close"
        >
          Cancel
        </button>
      </template>
      <template #footer="{ close }">
        <button
          type="button"
          @click="close"
        >
          Close
        </button>
      </template>
    </Dialog>
  </div>
</template>
```
