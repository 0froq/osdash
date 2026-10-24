---
title: Pagination
designStatus: ai-draft
description: A page window with native button or anchor controls.
model:
  type: number
  default: "1"
  description: Current page model. Its displayed value is finite, floored and clamped, without rewriting the parent model.
props:
  - name: label
    type: string
    required: true
    description: Accessible name for the navigation landmark.
  - name: pages
    type: number
    required: true
    description: Page count. Finite values are floored and capped at Number.MAX_SAFE_INTEGER; invalid values become zero.
  - name: previousLabel
    type: string
    required: true
    description: Visible and accessible label for the previous-page control.
  - name: nextLabel
    type: string
    required: true
    description: Visible and accessible label for the next-page control.
  - name: pageLabel
    type: (page: number) => string
    required: true
    description: Creates the accessible label for a numbered page control.
  - name: siblingCount
    type: number
    default: "1"
    description: Number of pages shown on each side of the current page. It is floored, capped and normalized like pages.
  - name: disabled
    type: boolean
    default: "false"
    description: Disables all page controls.
  - name: href
    type: (page: number) => string
    description: Optional URL callback. Enabled controls render as real anchors when provided.
slots:
  - name: control
    description: Receives page, kind, tag, and props for each previous, numbered-page, and next control. Preserve the supplied native tag, bind props, and honor disabled state.
---

Pagination renders a labeled `<nav>` with a window containing the first and last pages, the current page and its siblings, and decorative gaps when pages are omitted. `pages` and `siblingCount` are floored finite non-negative values capped at `Number.MAX_SAFE_INTEGER`; invalid values become zero. The current display page is floored and clamped to `1..max(1, pageCount)`. A non-finite model displays page 1. Display normalization does not rewrite the parent model. With zero pages, no numbered pages are shown and the previous/next controls are disabled.

By default, enabled controls are native buttons. When `href` is provided, enabled controls become real anchors; disabled controls remain native disabled buttons. On an anchor control, a normal primary click updates the numeric model to the selected page. Modified clicks (Ctrl, Meta, Shift, Alt), non-primary clicks, or already prevented events do not update the model, so native link behavior remains available. An already prevented event does not update the model on either native control.

The `control` slot receives `{ page, kind, tag, props }`, where `kind` is `page`, `previous`, or `next`, and `tag` is `a` or `button`. Render the supplied tag and bind the supplied `props`; preserve `disabled` and `aria-disabled` semantics. `PaginationControlProps` is exported from `@froq/ui/vue`. The component does not fetch data, integrate with a router, or announce page changes through a live region. It uses ordinary browser Tab navigation and native Enter/Space activation for buttons; it is not a tablist and does not implement arrow-key roving focus.

URL and label callbacks must be pure render functions; the URL callback must return a valid, non-empty URL. A router adapter belongs in the `control` slot, not in the library. Preserve native buttons for disabled controls rather than rendering an active link with only `aria-disabled`.

Undeclared attributes are applied to the `<nav>`. Pagination uses the UI library tokens and has no font, route, or business-data dependency. Import `style.css` in the caller and place it inside an element with `class="ui"`.

## Usage

```vue
<script setup lang="ts">
import { Pagination } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const page = ref(3)
const pages = 24
function pageLabel(value: number) {
  return `Go to page ${value}`
}
</script>

<template>
  <div class="ui">
    <Pagination
      v-model="page"
      label="Search results pages"
      :pages="pages"
      previous-label="Previous"
      next-label="Next"
      :page-label="pageLabel"
      :sibling-count="1"
      :href="value => `/search?page=${value}`"
    />
  </div>
</template>
```
