---
title: HoverCard
designStatus: ai-draft
description: A delayed, non-interactive preview for an existing link.
model:
  type: boolean
  default: "false"
  description: Preview open state. The disabled prop suppresses the preview without rewriting this model.
props:
  - name: label
    type: string
    required: true
    description: Fallback trigger text when no trigger slot is supplied.
  - name: href
    type: string
    required: true
    description: Destination for the trigger link.
  - name: disabled
    type: boolean
    default: "false"
    description: Suppresses preview opening without disabling the link or changing the model.
  - name: openDelay
    type: number
    default: "700"
    description: Delay in milliseconds before opening. Finite values are clamped to zero or greater; invalid values fall back to 700.
  - name: closeDelay
    type: number
    default: "300"
    description: Delay in milliseconds before closing. Finite values are clamped to zero or greater; invalid values fall back to 300.
  - name: side
    type: "'top' | 'right' | 'bottom' | 'left'"
    default: bottom
    description: Preferred side of the link; collision handling may reposition the preview.
  - name: align
    type: "'start' | 'center' | 'end'"
    default: start
    description: Preferred alignment against the link; collision handling may reposition the preview.
  - name: sideOffset
    type: number
    default: "8"
    description: Distance in pixels between the link and preview.
  - name: portalTo
    type: string | HTMLElement
    description: Teleport target. Defaults to the closest consumer element with class ui, or renders inline when none exists.
slots:
  - name: trigger
    description: Optional single real anchor or component that forwards its anchor attributes, listeners, and href.
  - name: default
    description: Required, non-interactive informational preview content. It is hidden from assistive technology.
---

HoverCard pairs a required `href` link with a delayed informational preview. It is not a replacement for link content: the link itself owns the accessible name and contains all essential information. `label` is used as visible trigger text only when no trigger slot is provided. If using a trigger slot, render one real anchor or a component that forwards the attributes, listeners, and `href` it receives; make sure its content provides an accessible link name.

The required default slot contains non-essential preview information and is intentionally marked `aria-hidden="true"`, so assistive technology does not expose it. Do not put buttons, links, form fields, or other interactive controls in the preview. Use Popover for actions and Tooltip for a brief description.

The boolean `v-model` defaults to `false`. `openDelay` defaults to 700ms and `closeDelay` to 300ms. Finite values are clamped to zero or greater; non-finite values fall back to those defaults. HoverCard relies on Reka UI hover and focus behavior, including its delays, pointer travel, and text-selection handling. Focus opens the preview after `openDelay`, and blur closes it after `closeDelay`. On touch devices the link remains a link; there is no separate touch-to-open behavior.

`disabled` suppresses preview opening but does not disable the anchor or force the parent model to `false`. If the model was already true, the preview is hidden while disabled and the model value is preserved. The preview prefers `side`, `align`, and `sideOffset`, with automatic collision handling and 12 pixels of collision padding. Undeclared attributes are forwarded to the preview content, not to the link. The component root does not add the `.ui` class.

By default, preview content is teleported into the closest consumer element with `class="ui"`; if none exists, it renders inline. During SSR, only the trigger link renders; the preview appears on the client when opened and unmounts when closed. A custom `portalTo` target must already exist and provide the consumer's theme and UI tokens. Import `style.css` in the caller and provide a `.ui` ancestor for library styles and the default portal target.

## Usage

```vue
<script setup lang="ts">
import { HoverCard } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)
</script>

<template>
  <div class="ui">
    <HoverCard
      v-model="open"
      label="View profile"
      href="/people/ada"
      :open-delay="700"
      :close-delay="300"
    >
      <template #trigger>
        <a> Ada Lovelace </a>
      </template>
      <p>Mathematician and writer.</p>
    </HoverCard>
  </div>
</template>
```
