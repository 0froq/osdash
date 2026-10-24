---
title: Breadcrumb
designStatus: ai-draft
description: An ordered navigation trail with links and a current location.
props:
  - name: label
    type: string
    required: true
    description: Accessible name for the navigation landmark.
  - name: items
    type: NavigationItem[]
    required: true
    description: Ordered items with unique values, labels, and optional hrefs.
  - name: current
    type: string
    default: last item value
    description: Value identifying the current item; defaults to the last item's value.
slots:
  - name: link
    description: For items with href only, receives item and props (BreadcrumbLinkProps: class, href, aria-current); no click handler is provided.
---

Breadcrumb renders an ordered list inside a labeled `<nav>` landmark. Items with an `href` render as links; items without one render as plain text. The item whose value matches `current` receives `aria-current="page"` on its link or text. By default, the last item's value is current. If `current` does not match any item, none is marked current.

Item values must be unique. The optional `link` slot is used only for items with an `href`; it receives `item` and `props` containing `class`, `href`, and `aria-current`, with no click handler. For router or locale-aware links, adapt the supplied href in the consuming application. Breadcrumb does not generate paths or truncate the trail. Undeclared attributes are applied to the `<nav>` element.

## Usage

```vue
<script setup lang="ts">
import { Breadcrumb } from '@froq/ui'
import '@froq/ui/style.css'

const items = [
  { value: 'docs', label: 'Docs', href: '/docs' },
  { value: 'guide', label: 'Guide', href: '/docs/guide' },
  { value: 'current', label: 'Current page' },
]
</script>

<template>
  <div class="ui">
    <Breadcrumb
      :items="items"
      label="Breadcrumb"
    />
  </div>
</template>
```
