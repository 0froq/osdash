---
title: Button
designStatus: ai-draft
description: A native button with a small, consistent surface style.
props:
  - name: type
    type: "'button' | 'submit' | 'reset'"
    default: button
    description: The native button type.
slots:
  - name: default
    description: Button content.
---

Button renders a native `<button>`. Use its default slot for the button label or content. It does not declare a `disabled` prop, but Vue automatically applies undeclared attributes such as `disabled`, `name`, and `aria-label` to the root button.

## Usage

```vue
<script setup lang="ts">
import { Button } from '@froq/ui'
</script>

<template>
  <div class="ui">
    <Button type="button">
      Save
    </Button>
  </div>
</template>
```
