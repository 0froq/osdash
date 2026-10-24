---
title: Toast
designStatus: ai-draft
description: A dismissible, timed notification managed by a ToastRegion.
model:
  type: boolean
  default: "false"
  description: Whether this toast is open.
props:
  - name: title
    type: string
    required: true
    description: Toast title and part of its announcement.
  - name: closeLabel
    type: string
    required: true
    description: Accessible name for the close button.
  - name: description
    type: string
    description: Optional description shown below the title.
  - name: duration
    type: number
    description: Auto-dismiss delay in milliseconds; overrides the region duration. Zero, negative, or non-finite values disable auto-dismiss.
  - name: type
    type: "'foreground' | 'background'"
    default: foreground
    description: Announcement urgency. Foreground uses assertive live announcement; background uses polite.
  - name: action
    type: "{ label: string, altText: string }"
    description: Optional action button label and alternate description for assistive technology.
events:
  - name: action
    payload: MouseEvent
    description: Emitted when the action button is clicked. Activation also closes the toast without waiting for asynchronous work; no event-versus-dismissal ordering is promised.
slots:
  - name: default
    description: Read-only description content, replacing the description prop when provided.
---

Toast is a controlled, dismissible notification. It must be rendered inside a `ToastRegion`, which provides the shared timing and viewport context. `type="foreground"` uses assertive announcement; `background` uses polite announcement. The default slot supplies read-only description content and takes precedence over `description`.

An `action` object has `label` and `altText`. Clicking it emits `action` with the native `MouseEvent` and closes the toast; no event-versus-dismissal ordering is promised. The action is not awaited, and preventing the event's default does not guarantee that the toast will remain open. Any meaningful operation and a persistent alternative path for ignoring or missing the action belong to the consumer.

The toast uses its own `duration` when supplied; otherwise it uses the containing region's duration (5000 ms by default). A finite positive duration starts on mount. Zero, negative, `NaN`, or infinite values disable automatic closing. Hovering or focusing the toast viewport, or blurring the browser window, pauses the countdown; it resumes with the remaining time. Reopening the toast or changing its duration resets the timer. Changing its text does not. No timer runs during SSR, and the timer is cleared when its scope is disposed.

Escape closes the toast only when focus is inside that toast. If a toast closes while it contains focus, focus moves to the viewport. Toast attributes are applied to the toast root. The component does not implement swipe dismissal or animation; queueing, IDs, and asynchronous result state are consumer-owned.

## Usage

```vue
<script setup lang="ts">
import { Button, Toast, ToastRegion } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)

function handleAction(event: MouseEvent) {
  console.info('Notification action clicked', event)
}
</script>

<template>
  <div class="ui">
    <ToastRegion
      label="Notification"
      viewport-label="Notifications ({hotkey})"
    >
      <Button
        type="button"
        @click="open = true"
      >
        Show notification
      </Button>
      <Toast
        v-model="open"
        title="Example notification"
        description="This is a temporary notice."
        close-label="Dismiss notification"
        :action="{ label: 'Review', altText: 'Review the related item' }"
        @action="handleAction"
      />
    </ToastRegion>
  </div>
</template>
```
