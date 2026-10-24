---
title: Tooltip
designStatus: ai-draft
description: A short text hint shown beside a focusable trigger.
model:
  type: boolean
  default: "false"
  description: Whether the tooltip is open.
props:
  - name: text
    type: string
    required: true
    description: Short, non-interactive tooltip text.
  - name: disabled
    type: boolean
    default: "false"
    description: Suppress tooltip interactions without disabling the trigger or preventing parent model updates.
  - name: delayDuration
    type: number
    default: "500"
    description: Delay in milliseconds, clamped to zero or above; non-finite values fall back to 500.
  - name: side
    type: "'top' | 'right' | 'bottom' | 'left'"
    default: top
    description: Preferred side of the trigger.
  - name: align
    type: "'start' | 'center' | 'end'"
    default: center
    description: Preferred alignment against the trigger.
  - name: sideOffset
    type: number
    default: "8"
    description: Distance in pixels between the trigger and tooltip content.
  - name: portalTo
    type: "string | HTMLElement"
    description: Teleport target. Defaults to the closest consumer element with class ui, or renders inline when none exists.
slots:
  - name: default
    description: A single focusable native button or a button component that forwards the trigger attributes and button ref.
---

Tooltip shows short text beside a focusable trigger. Its default slot must resolve to one real button, or a button component that forwards the attributes and button ref supplied by the trigger primitive. The tooltip text is not a substitute for the trigger's own accessible label; for example, an `IconButton` still needs its `label` prop. Tooltip content is text only and should not contain interactive elements.

`disabled` suppresses tooltip interactions, but does not set the trigger's native `disabled` state or prevent the parent from changing `v-model`. `delayDuration` is normalized to a finite value greater than or equal to zero; invalid or non-finite values use 500 ms. Each Tooltip creates its own provider, so its delay setting is local to that instance rather than shared with sibling tooltips.

Undeclared attributes are forwarded to the tooltip content, not the trigger. By default, content is teleported into the closest consumer element with `class="ui"`; if none exists, it renders inline on the client. On the server, only the trigger is rendered and the content appears on the client. A custom `portalTo` target must exist and provide the consumer's theme and UI tokens. Tooltip does not add the `.ui` class to its root.

## Usage

```vue
<script setup lang="ts">
import { Tooltip } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)
</script>

<template>
  <div class="ui">
    <Tooltip
      v-model="open"
      text="Copy the link"
      side="top"
      align="center"
      :side-offset="8"
      :delay-duration="500"
    >
      <button type="button">
        Copy
      </button>
    </Tooltip>
  </div>
</template>
```
