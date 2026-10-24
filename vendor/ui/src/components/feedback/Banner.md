---
title: Banner
designStatus: ai-draft
description: A site-wide notice for announcements, activities or work-in-progress information.
props:
  - name: label
    type: string
    required: true
    description: Accessible name of the notice region.
  - name: dismissLabel
    type: string
    description: Accessible name of the optional dismiss button. Omit for a persistent notice.
events:
  - name: dismiss
    payload: void
    description: Requests dismissal without hiding the component or moving focus.
slots:
  - name: default
    description: Notice content supplied by the caller.
  - name: actions
    description: Optional links or buttons, including router-aware links.
---

Banner is a full-width notice placed above a site's header or content, unlike an inline Alert. It stays in normal flow, so it takes its own space, and sticks to the top of the scrollport. It wraps naturally. It has no timer, storage, routing or `v-model`.

The required `label` names a region. This is not the `banner` landmark reserved for the site's header, and it is not an automatic live announcement. Important static notices remain available without repeatedly interrupting assistive technology.

Providing `dismissLabel` adds a button that emits `dismiss`. The caller owns visibility, persistence and focus after removal. Do not make required information available only in a dismissible notice. The `actions` slot accepts genuine links or buttons; do not make the whole notice clickable.

Import `@froq/ui/style.css` and place it inside `.ui`. Copy, links, translations and campaign policy stay outside the library.

## Usage

```vue
<script setup lang="ts">
import { Banner } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <Banner label="Site notice">
      This site is a work in progress.
      <template #actions>
        <a href="/changelog">See what's changing</a>
      </template>
    </Banner>
  </div>
</template>
```
