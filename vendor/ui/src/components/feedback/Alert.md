---
title: Alert
designStatus: ai-draft
description: An inline message with optional live announcement and dismissal.
props:
  - name: title
    type: string
    description: Optional heading displayed above the default slot.
  - name: announcement
    type: "'polite' | 'assertive' | 'off'"
    default: polite
    description: Selects a polite status announcement, an assertive alert, or no live announcement semantics.
  - name: dismissLabel
    type: string
    description: Accessible label for the dismiss button. The button is omitted when this prop is not provided.
events:
  - name: dismiss
    payload: void
    description: Emitted without arguments when the dismiss button is activated. The component does not hide itself or move focus.
slots:
  - name: default
    description: Alert message content.
---

Alert displays optional `title` content and the default slot. `announcement` defaults to `polite`: it uses a `status` live region; `assertive` uses an `alert` role; `off` omits live-region semantics. An alert rendered in the initial server HTML is not guaranteed to be announced by assistive technology. Use dynamic announcements when appropriate; an announcement is not a substitute for making an important warning persistently available.

Providing `dismissLabel` adds a dismiss button. Activating it emits `dismiss` with no arguments. The component does not hide itself, manage visibility, or move focus; the consuming component handles those actions and any focus placement after dismissal.

The component has no `v-model`. Its styles use the UI library tokens and do not depend on fonts, routes, or business state. Import `style.css` in the caller and place the component inside an element with `class="ui"`.

## Usage

```vue
<script setup lang="ts">
import { Alert } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const visible = ref(true)
</script>

<template>
  <div class="ui">
    <Alert
      v-if="visible"
      title="Connection restored"
      dismiss-label="Dismiss message"
      @dismiss="visible = false"
    >
      Your changes have been saved.
    </Alert>
  </div>
</template>
```
