---
title: Popover
designStatus: ai-draft
description: A non-modal panel anchored to a trigger button or an external element.
model:
  type: boolean
  default: "false"
  description: Whether the popover is open.
props:
  - name: reference
    type: HTMLElement
    description: External anchor element. Replaces the built-in trigger; the caller controls opening through v-model.
  - name: label
    type: string
    required: true
    description: Accessible name for the popover content and fallback trigger text.
  - name: closeLabel
    type: string
    required: true
    description: Accessible name for the built-in close button.
  - name: triggerLabel
    type: string
    description: Trigger text when no trigger slot is provided; defaults to label.
  - name: disabled
    type: boolean
    default: "false"
    description: Disables the trigger button.
  - name: side
    type: "'top' | 'right' | 'bottom' | 'left'"
    default: bottom
    description: Preferred side of the trigger. The position may change to avoid collisions.
  - name: align
    type: "'start' | 'center' | 'end'"
    default: start
    description: Preferred alignment against the trigger. The position may change to avoid collisions.
  - name: sideOffset
    type: number
    default: "8"
    description: Distance in pixels between the trigger and content.
  - name: portalTo
    type: string | HTMLElement
    description: Teleport target. Defaults to the closest consumer element with class ui, or renders inline when none exists.
slots:
  - name: trigger
    description: Optional single real button (or button component forwarding attributes) used as the trigger.
  - name: default
    description: Popover content. Receives a close function in its slot props.
---

Popover is a non-modal, trigger-anchored panel. The trigger slot must resolve to one real button; a button component used there must forward the attributes and listeners passed by the primitive. The default slot receives `{ close }`. Calling `close()` or pressing Escape or interacting outside closes the panel. Closing unmounts its content.

The panel prefers `side` and `align`, then automatically adjusts to avoid viewport collisions with 12 pixels of collision padding. `disabled` applies only to the trigger. Undeclared attributes are forwarded to the content panel, not the trigger. The component root does not add the `.ui` class.

By default, content is teleported into the closest consumer element with `class="ui"`; if there is none, it renders inline. On the server, only the trigger is rendered; portal content appears after opening on the client. A custom `portalTo` target must already exist and provide the consumer's theme and UI tokens. The library does not add Reka UI CSS variables to its token contract.

Popover is not a menu, tooltip, or modal dialog. Keep complex content and its business behavior in the consuming application. Import `style.css` in the caller and provide a `.ui` ancestor for the library styles and default portal target.

## Usage

For an externally managed target such as a code token, pass its DOM element as
`reference` and control `v-model`. No trigger button is rendered in this mode.
The caller owns hover timing and focus restoration; content event listeners can
prevent `open-auto-focus` and `close-auto-focus` when focus should stay on the target.

```vue
<script setup lang="ts">
import { Button, Popover } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)
</script>

<template>
  <div class="ui">
    <Popover
      v-model="open"
      label="Publication status"
      close-label="Close status"
    >
      <template #trigger>
        <Button>Publication status</Button>
      </template>
      <template #default="{ close }">
        <p>This document is still a draft.</p>
        <Button @click="close">
          Understood
        </Button>
      </template>
    </Popover>
  </div>
</template>
```
