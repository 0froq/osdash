---
title: Menu
designStatus: ai-draft
description: An accessible menu with optional nested submenus.
model:
  type: boolean
  default: "false"
  description: Whether the menu is open. Supports v-model.
props:
  - name: label
    type: string
    required: true
    description: Accessible menu name and fallback trigger text.
  - name: items
    type: MenuItem[]
    required: true
    description: Menu entries and optional nested submenu entries.
  - name: disabled
    type: boolean
    default: "false"
    description: Disables the trigger only; disable individual entries on their MenuItem.
  - name: modal
    type: boolean
    default: "true"
    description: Controls whether interaction outside the open menu is modal.
  - name: dir
    type: "'ltr' | 'rtl'"
    description: Text and keyboard direction. Defaults to the Reka UI direction context, then ltr.
  - name: side
    type: "'top' | 'right' | 'bottom' | 'left'"
    default: bottom
    description: Preferred side of the trigger; collision handling may reposition the menu.
  - name: align
    type: "'start' | 'center' | 'end'"
    default: start
    description: Preferred alignment against the trigger; collision handling may reposition the menu.
  - name: sideOffset
    type: number
    default: "8"
    description: Distance in pixels between the trigger and menu content.
  - name: portalTo
    type: string | HTMLElement
    description: Teleport target. Defaults to the closest consumer element with class ui, or renders inline when none exists.
events:
  - name: select
    payload: MenuItem, Event
    description: Emitted when a selectable leaf entry is chosen, with its item and original cancelable selection event. Prevent the event default to keep the menu open.
slots:
  - name: trigger
    description: Optional single real button, or a button component forwarding the trigger attributes and listeners.
  - name: item
    description: Replaces an item's label content and receives item. Keep this content non-interactive; do not add interactive descendants.
---

Menu is an accessible menu that can contain nested submenus. Its trigger slot must resolve to one real button; a button component used there must forward the attributes and listeners provided by the primitive. Without that slot, `label` supplies the trigger text. `disabled` affects only the trigger.

`items` use the shared `MenuItem` shape: `{ value, label, disabled?, separatorBefore?, children? }`. Keep `value` unique among siblings. A non-empty `children` array makes an entry a submenu trigger, which cannot itself be selected; an empty or omitted `children` array makes it a selectable leaf. `separatorBefore` adds a visual separator before the entry except at the beginning of its sibling list. The `item` slot receives `{ item }` and replaces only the label content. Keep it free of buttons, links, or other interactive descendants so menu keyboard interaction remains intact.

Selecting a leaf emits `select` with the `MenuItem` and the original cancelable event. Prevent its default to keep the menu open. The consumer owns the action for each item; entries do not imply links, routing, checkboxes, or radio state. Reka UI provides menu keyboard behavior, including arrow-key navigation, typeahead, Escape to close, and disabled-entry handling.

The component supports `v-model` for its boolean open state, defaulting to `false`. `modal` defaults to `true`. `dir` accepts `ltr` or `rtl`; when omitted it follows the Reka UI direction context, which falls back to `ltr`. The menu prefers `side`, `align`, and `sideOffset`, then automatically handles collisions with 12 pixels of collision padding. Undeclared attributes are forwarded to the menu content, not the trigger. The component root does not add the `.ui` class.

By default, content is teleported into the closest consumer element with `class="ui"`; if there is none, it renders inline. On the server, only the trigger is rendered; menu content appears after opening on the client. A custom `portalTo` target must already exist and provide the consumer's theme and UI tokens. The library does not add Reka UI CSS variables to its token contract. Import `style.css` in the caller and provide a `.ui` ancestor for the library styles and default portal target.

## Usage

```vue
<script setup lang="ts">
import type { MenuItem } from '@froq/ui/vue'
import { Button, Menu } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)
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

function selectItem(item: MenuItem, event: Event) {
  if (item.value === 'edit') {
    event.preventDefault()
    // Perform the consumer-owned action while keeping the menu open.
  }
}
</script>

<template>
  <div class="ui">
    <Menu
      v-model="open"
      label="Document actions"
      :items="items"
      @select="selectItem"
    >
      <template #trigger>
        <Button>Document actions</Button>
      </template>
    </Menu>
  </div>
</template>
```
