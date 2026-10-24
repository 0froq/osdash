---
title: Avatar
designStatus: ai-draft
description: A fixed-size image with a loading placeholder and text fallback.
props:
  - name: label
    type: string
    required: true
    description: Accessible name for the avatar image.
  - name: fallback
    type: string
    required: true
    description: Text shown when no image source is provided or loading fails.
  - name: src
    type: string
    description: Optional image source.
  - name: loading
    type: "'lazy' | 'eager'"
    default: lazy
    description: Native image loading strategy; this is not a skeleton visibility setting.
---

Avatar has a 40px circular root with `role="img"` and the required `label` as its accessible name. While a provided image is loading, it shows the shared Skeleton; after a successful load it shows the image, and without a source or after an error it shows `fallback`. It checks cached image completion after mounting, and resets its load state when `src` changes.

`loading` controls the native image loading strategy (`lazy` or `eager`); it does not control the Skeleton. The root has no slots or `v-model`. Pass `class` or `style` to the root to override its dimensions. Styles use the UI library tokens and do not depend on routes or business state. Import `style.css` in the caller and put Avatar inside an element with `class="ui"`.

## Usage

```vue
<script setup lang="ts">
import { Avatar } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <Avatar
      label="Froq"
      fallback="fq"
      src="/people/froq.webp"
      loading="lazy"
    />
  </div>
</template>
```
