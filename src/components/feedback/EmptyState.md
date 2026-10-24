---
title: EmptyState
designStatus: ai-draft
description: A titled section for explaining an empty result and offering next actions.
props:
  - name: title
    type: string
    required: true
    description: Visible heading that names the section.
  - name: description
    type: string
    description: Optional explanatory text below the heading.
slots:
  - name: default
    description: Additional content for the empty section.
  - name: actions
    description: Optional actions for the empty section.
---

EmptyState renders a `<section>` named by its visible `<h2>`, with optional description, additional content, and actions. It is a section primitive, not a whole-page layout. It does not create live-region or status semantics; if an update needs to be announced, the consuming application must provide the appropriate announcement behavior.

## Usage

```vue
<script setup lang="ts">
import { Button, EmptyState } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <EmptyState
      title="No saved documents"
      description="Save a document to find it here later."
    >
      <template #actions>
        <Button type="button">
          Explore documents
        </Button>
      </template>
    </EmptyState>
  </div>
</template>
```
