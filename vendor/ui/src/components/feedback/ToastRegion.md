---
title: ToastRegion
designStatus: ai-draft
description: A shared provider and viewport for one or more Toast notifications.
props:
  - name: label
    type: string
    required: true
    description: Non-empty label associated with each toast announcement.
  - name: viewportLabel
    type: string
    required: true
    description: Non-empty accessible name for the notification viewport; supports the {hotkey} placeholder.
  - name: duration
    type: number
    default: "5000"
    description: Default auto-dismiss delay in milliseconds for child Toast components.
  - name: hotkey
    type: string[]
    default: "['F8']"
    description: Keyboard shortcut that focuses the viewport; pass an empty array to disable it.
  - name: position
    type: "'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'"
    default: bottom-end
    description: Logical viewport position using inline start and end.
  - name: portalTo
    type: "string | HTMLElement"
    description: Teleport target. Defaults to the nearest ancestor with class ui; without one, viewport content renders inline on the client.
slots:
  - name: default
    description: Toast components that share this region's provider and viewport.
---

ToastRegion provides one shared notification viewport and timing context for its child `Toast` components. Render multiple toasts inside a single region to share pause behavior and viewport; the consumer owns toast IDs, queueing, and any asynchronous result state. `label` and `viewportLabel` should both be non-empty. The viewport label may include `{hotkey}`, which is replaced with the configured shortcut. The default shortcut is F8; pass `:hotkey="[]"` to disable the shortcut.

`duration` defaults to 5000 ms and is inherited by child toasts that do not specify their own duration. The four `position` values use logical inline start/end, so they follow the page's writing direction. The region disables swipe dismissal for its toasts.

Undeclared attributes are applied to the viewport. By default, the viewport is teleported to the nearest consumer ancestor with class `.ui`; if no such target exists, it renders inline on the client. The viewport and toast content appear on the client; ordinary content in the default slot, such as a button, can still render during SSR. A custom `portalTo` target must exist and provide the consumer's theme and UI tokens. The region does not add `.ui`; import `style.css` and provide that scope in the consumer.

## Usage

```vue
<script setup lang="ts">
import { Button, Toast, ToastRegion } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const firstOpen = ref(false)
const secondOpen = ref(false)
</script>

<template>
  <div class="ui">
    <ToastRegion
      label="Notifications"
      viewport-label="Notifications ({hotkey})"
      position="bottom-end"
      :duration="5000"
    >
      <Button
        type="button"
        @click="firstOpen = true"
      >
        Show first notice
      </Button>
      <Button
        type="button"
        @click="secondOpen = true"
      >
        Show second notice
      </Button>
      <Toast
        v-model="firstOpen"
        title="First notice"
        close-label="Dismiss first notice"
      >
        This is a temporary example notice.
      </Toast>
      <Toast
        v-model="secondOpen"
        title="Second notice"
        close-label="Dismiss second notice"
        type="background"
      >
        This background notice uses polite announcement.
      </Toast>
    </ToastRegion>
  </div>
</template>
```
