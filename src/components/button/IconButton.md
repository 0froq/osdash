---
title: IconButton
designStatus: ai-draft
description: A button with an accessible label and decorative icon content.
props:
  - name: label
    type: string
    required: true
    description: Accessible name applied to the button.
  - name: type
    type: "'button' | 'submit' | 'reset'"
    default: button
    description: Native button type.
slots:
  - name: default
    description: Decorative icon content; rendered inside an aria-hidden wrapper.
---

IconButton renders a real button. Use the default slot for the icon artwork only; it is hidden from assistive technology and must not contain interactive controls. The required `label` supplies the button's accessible name. Undeclared native attributes and event listeners are forwarded to the button. For a toggle button, pass `aria-pressed` from the consuming component; IconButton does not manage pressed state or provide a tooltip.

## Usage

```vue
<script setup lang="ts">
import { IconButton } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <IconButton
      label="Bookmark document"
      type="button"
      aria-pressed="false"
      @click="console.info('Bookmark clicked')"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M6 3h12v18l-6-4-6 4z" />
      </svg>
    </IconButton>
  </div>
</template>
```
