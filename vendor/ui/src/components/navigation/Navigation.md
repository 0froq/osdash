---
title: Navigation
designStatus: ai-draft
description: A flat row of links with an active value model.
model:
  type: string
  default: "''"
  description: The selected item's value.
props:
  - name: items
    type: NavigationItem[]
    required: true
    description: Flat list of items with a unique value, label, and optional href.
  - name: current
    type: "'page' | 'location'"
    default: page
    description: The aria-current value applied to the active link.
slots:
  - name: link
    description: Receives item and props (NavigationLinkProps) for a custom link.
---

Navigation displays a flat, wrapping row of links. It is not a tabs widget: it does not implement tab panels or arrow-key navigation. The default anchors support native Tab and Enter behavior. `v-model` contains the active item's `value`. Set `current="location"` for an active link to a location within the current page; the default is `page`.

By default, links use each item's `href`. Clicking an item without an `href` selects it without navigating. Modified clicks retain browser link behavior without changing the selection. If another handler prevents the click, Navigation leaves the selection unchanged. The link slot receives `item` and `props` (`NavigationLinkProps`); bind the supplied props to preserve the default link behavior and accessibility.

Navigation does not provide copy, route URLs, or scroll tracking. The consuming application supplies item labels and URLs, maps router state to `v-model`, and implements any scroll spy. For router links, use the slot adapter to remove `href` and `onClick` from the supplied props, bind the remaining props, pass the item's URL as `to`, and update the model from the confirmed route.

The component does not add the `.ui` scope class. Import `style.css` in the caller and place Navigation inside an element with `class="ui"`.

## Usage

```vue
<script setup lang="ts">
import { Navigation } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const active = ref('guide')
const items = [
  { value: 'guide', label: 'Guide', href: '#guide' },
  { value: 'components', label: 'Components', href: '#components' },
]
</script>

<template>
  <div class="ui">
    <Navigation
      v-model="active"
      :items="items"
      current="location"
      aria-label="Documentation"
    />
  </div>
</template>
```

For the shared unstyled behavior, `useNavigation(active)` from `@froq/ui/vue` returns `isActive(item)` and `activate(event, item)`.
