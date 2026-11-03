---
title: Drawer
designStatus: ai-draft
description: A dialog panel attached to the left, right, or bottom edge.
model:
  type: boolean
  default: 'false'
  description: Whether the drawer is open.
props:
  - name: title
    type: string
    required: true
    description: Visible drawer title.
  - name: closeLabel
    type: string
    required: true
    description: Accessible name for the built-in close button.
  - name: description
    type: string
    description: Optional visible description associated with the dialog content.
  - name: triggerLabel
    type: string
    default: title
    description: Trigger text when no trigger slot is provided; defaults to title.
  - name: showTrigger
    type: boolean
    default: 'true'
    description: Render an opener. A handle slot replaces the regular trigger. When false, neither trigger nor handle is rendered.
  - name: returnFocus
    type: HTMLElement
    description: Optional focusable element to receive focus when the drawer closes; takes precedence over the captured opener.
  - name: disabled
    type: boolean
    default: 'false'
    description: Disable the trigger only; a parent can still open the drawer through the model.
  - name: dismissible
    type: boolean
    default: 'true'
    description: Show the built-in close button and allow Escape or outside dismissal.
  - name: closeOnOutside
    type: boolean
    default: 'true'
    description: Allow outside interaction to close the drawer when dismissible is true.
  - name: closeOnScrollOutside
    type: boolean
    default: 'false'
    description: Close on wheel or touch movement over the backdrop when dismissible and closeOnOutside are true. Scrolling inside the drawer does not close it.
  - name: portalTo
    type: 'string | HTMLElement'
    description: Teleport target. Defaults to the nearest ancestor with class ui; without one, content renders inline on the client.
  - name: side
    type: "'left' | 'right' | 'bottom'"
    default: right
    description: Physical edge where the drawer is attached; left and right do not flip for RTL.
  - name: handleOffset
    type: string
    default: 24px
    description: CSS top offset of the handle on left/right drawers, or left offset on a bottom drawer.
slots:
  - name: handle
    description: Visual content of the persistent toggle button; receives open. Do not place another button inside. Takes precedence over trigger when showTrigger is true.
  - name: trigger
    description: Optional single button child; use a native button or a component that forwards attrs and its button ref.
  - name: default
    description: Drawer body; receives close() and is unmounted when the drawer closes.
  - name: footer
    description: Optional footer content; receives close().
events:
  - name: openAutoFocus
    payload: Event
    description: Forwarded through undeclared attributes to Dialog; synchronous and cancelable.
  - name: closeAutoFocus
    payload: Event
    description: Forwarded through undeclared attributes to Dialog; synchronous and cancelable.
---

Drawer reuses Dialog's controlled boolean `v-model`, close button, Escape/outside dismissal, modal focus handling, and `close()` slot props. With the default `showTrigger="true"`, Reka's built-in trigger supplies the default focus-return target; `disabled` only disables that built-in trigger, so callers must disable external controls themselves. Set `showTrigger="false"` for externally controlled modal workflows; neither the built-in trigger nor trigger slot is rendered. In this mode the layer captures a non-`body` active element at its `openAutoFocus` event, before default focus moves—not on every possible opening action. If the caller moves focus into content before that event, pass `returnFocus` explicitly. It must be a focusable `HTMLElement`; the helper does not add `tabindex` to ordinary elements.

With `showTrigger="false"`, focus restoration uses a valid `returnFocus` target first, then the captured opener. A target is usable only when connected, not disabled, hidden, or inert, and has layout. If neither is usable, the component does not guess a page-level fallback. With the built-in trigger shown, Reka UI handles its default focus return. Drawer forwards undeclared attributes, including `@open-auto-focus` and `@close-auto-focus`, to Dialog; these receive synchronous cancelable DOM events, so call `preventDefault()` synchronously. Use `@close-auto-focus.prevent` to take over focus restoration when the external candidates are inappropriate. `dismissible` controls the close button and Escape/outside dismissal. When dismissible is true, `closeOnOutside="false"` prevents outside dismissal while leaving the close button and Escape available. Parent model updates and slot `close()` can always close it.

`side` attaches the panel to a physical left, right, or bottom edge; left/right are not automatically flipped for RTL. The left and right variants use a width of `min(26rem, calc(100vw - 24px))` and a height of `100dvh`. The bottom variant spans the viewport width and uses its content height, capped at `calc(100dvh - 24px)`. The panel slides in from its `side` and slides back out before unmounting. Motion uses `--ui-dur` and `--ui-ease` and is disabled with `prefers-reduced-motion: reduce`. The side panel does not add swipe or drag gestures, height animation, or page table-of-contents behavior.

For an overlay sidebar, use `side="left"` and set the panel's width through `style`, such as `width: min(16rem, calc(100vw - 24px))`. CSS positioning can also be passed through `style`. The backdrop still covers the viewport. Enable `closeOnScrollOutside` to dismiss on wheel or touch movement over the backdrop. Scrolling inside the drawer keeps it open. This option requires both `dismissible` and `closeOnOutside` to be true and defaults to false.

A `handle` slot enables a persistent pull handle. Drawer renders its native toggle button with `aria-expanded`, `aria-controls`, and an accessible name from `triggerLabel`/`title` or `closeLabel`. Its visual contents receive `{ open }`. The button and panel share one translated shell, so they move together without separate positioning animations. The handle sits outside the panel on its inner edge. `handleOffset` positions it along that edge. The shell defaults to `min(26rem, calc(100vw - 48px))` width for side drawers to leave room for the handle. Keep room for the handle when overriding width, especially with a text label.

The handle remains inside the modal's focus scope while open. Closed panel contents are inert and hidden from assistive technology. Body and footer slots unmount after the exit motion, while the shell and handle remain. The closed handle allows Tab to move on to the page. `disabled` blocks opening with the handle; `dismissible="false"` disables closing with it. `showTrigger="false"` disables handle mode and uses the regular externally controlled drawer. A handle slot takes precedence when both `handle` and `trigger` are supplied. Closing returns focus to the handle. Because its focus scope stays mounted, handle mode does not dispatch `closeAutoFocus` on each close. Use regular trigger mode for custom `returnFocus` or close-autofocus workflows.

Undeclared attributes, including `class`, `style`, and autofocus event listeners, are forwarded to the dialog content (the moving shell in handle mode). The default portal target is the nearest consumer ancestor with class `.ui`; without one, content renders inline on the client. During SSR, the regular built-in trigger renders only when `showTrigger` is true and there is no handle slot. Handle mode renders its button in the portal on the client. Portal content does not render during SSR. A custom `portalTo` target must exist and provide the consumer's theme and UI tokens. The root does not add `.ui`. Body content unmounts when closed, so persist state that should survive closing in the consumer.

## Following handle

```vue
<Drawer
  v-model="open"
  title="Navigation"
  trigger-label="Open navigation"
  close-label="Close navigation"
  side="left"
  handle-offset="24px"
  close-on-scroll-outside
  style="width: min(16rem, calc(100vw - 48px))"
>
  <template #handle="{ open: expanded }">
    <span aria-hidden="true">{{ expanded ? '‹' : '›' }}</span>
  </template>
  <nav>Navigation links supplied by the caller.</nav>
</Drawer>
```

## Usage

```vue
<script setup lang="ts">
import { Drawer } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/tokens.css'

const open = ref(false)
</script>

<template>
  <div class="ui">
    <Drawer
      v-model="open"
      title="Filters"
      close-label="Close filters"
      side="right"
    >
      <template #default="{ close }">
        <p>Choose which results to show.</p>
        <button
          type="button"
          @click="close"
        >
          Done
        </button>
      </template>
    </Drawer>
  </div>
</template>
```
