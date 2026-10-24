---
title: Sidebar
designStatus: ai-draft
description: Grouped navigation with nested links, optional folding and a traveling selection frame.
model:
  type: string
  default: "''"
  description: The selected item's value. Values must be unique across all groups and levels.
props:
  - name: groups
    type: SidebarGroup[]
    required: true
    description: Groups of items. Each item has value, label, optional href and optional children.
  - name: foldable
    type: boolean
    default: 'false'
    description: Allow top-level items with children to fold. Group headings never fold.
slots:
  - name: link
    description: Receives item and props. Bind props to your link to preserve selection, classes and accessibility.
---

Sidebar displays one column with indented child links and guide lines. The selected link has a grayscale frame and a short accent rule. The frame moves between items in the same group; crossing groups places it immediately. Reduced motion disables travel.

`v-model` contains an item's `value`, not a route. Sidebar does not depend on a router. By default it renders anchors using `href`; items without `href` only change selection. Modified clicks keep normal link behavior without changing selection.

When `foldable` is enabled, inactive top-level branches begin collapsed. A separate button folds children without navigating. Selecting an item opens its top-level branch. Manually folding the selected branch moves the frame to its parent.

## Usage

```vue
<script setup lang="ts">
import type { SidebarGroup } from '@froq/ui'
import { Sidebar } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const active = ref('install')
const groups: SidebarGroup[] = [{
  label: 'Guide',
  items: [{
    value: 'start',
    label: 'Getting started',
    children: [{ value: 'install', label: 'Installation' }],
  }],
}]
</script>

<template>
  <div class="ui">
    <Sidebar
      v-model="active"
      :groups="groups"
      foldable
    />
  </div>
</template>
```

## Router links

Use the `link` slot for your router. Bind the supplied `props` to the actual link element; they include its class, `href`, `aria-current` and click handler. If the router uses `to` instead of `href`, omit `href` from the bound props and pass `item.href` as `to`. Keep the selected value synchronized with the confirmed route in your application.

`SidebarGroup`, `SidebarItem`, and `SidebarLinkProps` are exported from `@froq/ui` and `@froq/ui/vue`. The unstyled `useSidebar(groups, active, foldable)` behavior is exported from `@froq/ui/vue`.

Container width, sticky positioning and mobile scrolling belong to the consuming layout.
