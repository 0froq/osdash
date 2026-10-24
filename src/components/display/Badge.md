---
title: Badge
designStatus: ai-draft
description: A small inline label with muted or accent tone.
props:
  - name: tone
    type: "'muted' | 'accent'"
    default: muted
    description: Visual tone of the badge.
slots:
  - name: default
    description: Short label content.
---

Badge renders a `<span>` for a short inline label. Choose the muted or accent tone and provide its content through the default slot. It is not a button and does not automatically add status or live-region semantics; use the surrounding context to convey the meaning.

## Usage

```vue
<script setup lang="ts">
import { Badge } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <Badge>Draft</Badge>
    <Badge tone="accent">
      Updated
    </Badge>
  </div>
</template>
```
