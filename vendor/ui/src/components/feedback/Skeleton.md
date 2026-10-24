---
title: Skeleton
designStatus: ai-draft
description: A single placeholder surface that preserves a component's layout while loading.
props:
  - name: loading
    type: boolean
    default: "true"
    description: Show the placeholder surface and hide slot content while loading.
  - name: shape
    type: "'block' | 'text' | 'circle'"
    default: block
    description: Surface shape. A circle should be given equal width and height by the caller.
  - name: animation
    type: "'pulse' | false"
    default: pulse
    description: Pulse the surface or leave it static. Reduced-motion preferences disable the pulse.
  - name: width
    type: string | number
    description: CSS width; numeric values are interpreted as pixels.
  - name: height
    type: string | number
    description: CSS height; numeric values are interpreted as pixels.
slots:
  - name: default
    description: Optional content whose geometry is kept while its visibility is hidden during loading.
---

Skeleton draws one placeholder surface for a component region; it does not infer or render a list of loading rows. With a default slot, its content remains mounted while loading, is hidden, and becomes inert and `aria-hidden`; its layout still determines the reserved geometry. Slot lifecycle hooks and network or other side effects continue to run, so do not put expensive asynchronous rendering itself inside the slot.

Without a slot, reserve the expected dimensions with `width`, `height`, or caller CSS such as `aspect-ratio`. Keep the same dimensions after loading; applying a height only during loading changes the layout when content appears. A circle needs equal width and height from the caller. The text shape is a single bar, not an automatically generated paragraph. A wrapper without a slot has a minimum height of `1lh`; a slot wrapper uses `flow-root`.

Skeleton is visual only: it does not inspect fonts, routes, or network state. `aria-busy` reflects `loading`, but it does not announce a loading message; the consuming component must provide a suitable status description. Reduced-motion preferences disable the pulse. Skeleton does not animate width or height and cannot guarantee zero layout shift for arbitrary font swaps or unknown content dimensions.

## Usage

```vue
<script setup lang="ts">
import { Skeleton } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <Skeleton
      :loading="true"
      width="14rem"
      height="6rem"
    >
      <div>
        <h2>Account details</h2>
        <p>Your profile information appears here.</p>
      </div>
    </Skeleton>
  </div>
</template>
```
