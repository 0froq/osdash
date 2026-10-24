---
title: Card
designStatus: ai-draft
description: A simple bordered container with optional header and footer regions.
slots:
  - name: header
    description: Optional header content.
  - name: default
    description: Main card content.
  - name: footer
    description: Optional footer content.
---

Card is a simple `<div>` container with header, body, and footer slots. It has no props or model. The root is not an `<article>` and does not decide the meaning or layout of a business card; the consumer supplies headings, actions, and content. Its border and surface styling use the library tokens.

## Usage

```vue
<script setup lang="ts">
import { Badge, Button, Card } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <Card>
      <template #header>
        <Badge>Field notes</Badge>
      </template>
      <h2>Observations</h2>
      <p>Small observations, collected over time.</p>
      <template #footer>
        <Button type="button">
          Read notes
        </Button>
      </template>
    </Card>
  </div>
</template>
```
