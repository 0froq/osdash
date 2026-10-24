---
title: AspectRatio
designStatus: ai-draft
description: A fixed-ratio frame for media or other positioned content.
props:
  - name: ratio
    type: number
    default: "16 / 9"
    description: Width-to-height ratio. Non-finite or non-positive values fall back to 1.
  - name: fit
    type: "'cover' | 'contain'"
    default: cover
    description: Object fit for direct img and video children.
slots:
  - name: default
    description: Media or other content positioned inside the ratio frame.
---

AspectRatio fixes the root frame to the requested width-to-height `ratio`, defaulting to 16:9. A non-finite or non-positive ratio falls back to 1:1. Its child body is absolutely positioned, so slot content does not determine or increase the frame height.

The default slot accepts media or arbitrary content. `fit` defaults to `cover`; `contain` applies to direct `img` and `video` children. Direct iframes keep `object-fit: cover`, so provide an appropriate iframe title and handle its own content and loading in the consumer. AspectRatio does not manage loading; callers provide media `src`, `alt`, and loading behavior. It has no `v-model`.

Styles use the UI library tokens and do not depend on fonts, routes, or business state. Import `style.css` in the caller and place the component inside an element with `class="ui"`.

## Usage

```vue
<script setup lang="ts">
import { AspectRatio } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div
    class="ui"
    style="width: min(100%, 20rem)"
  >
    <AspectRatio
      :ratio="16 / 9"
      fit="contain"
    >
      <img
        src="/media/cover.webp"
        alt="Mountain reflected in a lake"
        loading="lazy"
      >
    </AspectRatio>
  </div>
</template>
```
