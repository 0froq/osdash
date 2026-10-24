---
title: ContextMenu
designStatus: ai-draft
description: A right-click and long-press menu for a focusable target region.
props:
  - name: label
    type: string
    required: true
    description: Accessible name for the focusable target and menu.
  - name: items
    type: MenuItem[]
    required: true
    description: Menu entries with optional disabled items, separators, and nested submenus.
  - name: disabled
    type: boolean
    default: "false"
    description: Suppress opening interactions on the target without disabling its child content.
  - name: modal
    type: boolean
    default: "true"
    description: Whether the open menu is modal relative to outside interaction.
  - name: dir
    type: "'ltr' | 'rtl'"
    description: Menu text and keyboard direction; defaults to the Reka UI direction context, then ltr.
  - name: portalTo
    type: "string | HTMLElement"
    description: Teleport target. Defaults to the closest consumer element with class ui, or renders inline when none exists.
events:
  - name: openChange
    payload: boolean
    description: Notifies accepted changes to the internally managed menu state; this is not a controlled model.
  - name: select
    payload: MenuItem, Event
    description: Emitted when a selectable leaf item is chosen, with its item and original cancelable selection event. Prevent the event default to keep the menu open.
slots:
  - name: default
    description: Required content region that acts as the context-menu target.
  - name: item
    description: Replaces an item's label text and receives item. Keep the content non-interactive.
---

ContextMenu wraps its default slot in a named, focusable `div` with `role="group"` and `aria-haspopup="menu"`. A right-click or touch/pen long press opens the menu; long press uses Reka UI's 700 ms delay. The wrapper also bridges the Context Menu key and Shift+F10 to a context-menu event at its center. The bridge only handles a key event targeted directly at the wrapper, so it does not intercept a bubbled keydown from a child.

This component manages open state internally; it has no `v-model` or `open` prop. `openChange` is informational. Selecting a leaf item emits `select` with the `MenuItem` and the original cancelable event. Preventing the event's default keeps the menu open. The consumer owns the action for each item.

Items use the shared recursive `MenuItem` shape: `{ value, label, disabled?, separatorBefore?, children? }`. Keep values unique among siblings. A non-empty `children` array makes an item a submenu trigger rather than a selectable item; an omitted or empty `children` array makes it a leaf. `separatorBefore` adds a separator before an item except at the start of its sibling list. The `item` slot replaces only the label content and applies recursively; keep it free of interactive descendants.

`disabled` suppresses opening interactions on the wrapper but does not disable its child content. The target and default slot remain mounted when this prop changes. Disabling closes an open menu and blocks a queued long-press callback from opening a stale menu; the helper does not cancel Reka UI's internal timeout, so its callback may still run but is gated. Re-enabling does not reopen the menu. A new real `contextmenu` event or touch/pen `pointerdown` re-arms opening. Disabled native context events are not intercepted and WebKit touch callout returns to its default; browser behavior determines the native menu. The wrapper is a focusable named group, not a button. Do not use this to replace the native context menu of text editors or other controls that rely on it; use an ordinary dropdown menu for an explicit action trigger.

## Exposed methods

- `close(): void` closes an open menu or rejects a pending open when called through a component ref. It does not unmount the target. The component does not automatically watch global scroll or route changes; choose and apply that closing policy in the consumer.

Undeclared attributes are forwarded to menu content, not the target wrapper. By default, content is teleported into the closest consumer element with `class="ui"`; without one, it renders inline on the client. During SSR, only the target is rendered and menu content appears on the client. Content unmounts when closed. A custom `portalTo` target must exist and provide the consumer's theme and UI tokens. Import `style.css` in the consumer and provide a `.ui` scope.

## Usage

```vue
<script setup lang="ts">
import type { MenuItem } from '@froq/ui/vue'
import { ContextMenu } from '@froq/ui'
import { useTemplateRef } from 'vue'
import '@froq/ui/style.css'

const items: MenuItem[] = [
  { value: 'edit', label: 'Edit' },
  {
    value: 'export',
    label: 'Export',
    children: [
      { value: 'pdf', label: 'PDF' },
      { value: 'csv', label: 'CSV' },
    ],
  },
]
const menu = useTemplateRef<{ close: () => void }>('menu')

function selectItem(item: MenuItem, event: Event) {
  if (item.value === 'edit') {
    event.preventDefault()
    // Perform the consumer-owned action while keeping the menu open.
  }
}
</script>

<template>
  <div class="ui">
    <ContextMenu
      ref="menu"
      label="Document context menu"
      :items="items"
      @select="selectItem"
      @open-change="open => console.info('Menu open:', open)"
    >
      <div class="document-preview">
        Right-click or focus this region and press Shift+F10.
      </div>
      <template #item="{ item }">
        {{ item.label }}
      </template>
    </ContextMenu>
    <button
      type="button"
      @click="menu?.close()"
    >
      Close context menu
    </button>
  </div>
</template>
```
