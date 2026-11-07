---
title: Tags
designStatus: ai-draft
description: A wrapping run of quiet words that state facts about a subject, each with a small leading mark.
props:
  - name: items
    type: TagItem[]
    required: true
    description: The tags, in order. Each has a `value` and `label`, and may set `tone`, `pending`, `href` and `external`. An empty list renders nothing.
  - name: label
    type: string
    description: Names the list for assistive tech.
events:
  - name: activate
    payload: TagItem, MouseEvent
    description: Emitted when a tag link is clicked, with its item and the original event. Call `stopPropagation()` on the event when the list sits inside a clickable surface.
slots:
  - name: tag
    description: "Replaces a tag's content. Scope: `{ item }`. The leading mark and the tone stay."
---

Tags states what is true of a subject: a card, a row, a page head. It is for facts, not for choosing. Use Pick when the reader selects values, and Badge for one bordered status label.

Each tag is meta-type text with a small capsule on its leading edge, the same mark Pick and Sidebar draw. The capsule is neutral at rest. `tone: 'accent'` turns it to the accent color and lifts the text to the foreground, for the one or two tags that ask for a look. Use it sparingly: when most tags are accent, none of them is.

`pending` draws a dashed underline for something that is still open. A tag with `href` is a link; add `external` to open it in a new tab without a referrer. The list is a real `<ul>`, so assistive tech reads its length.

## Usage

```vue
<script setup lang="ts">
import type { TagItem } from '@froq/ui'
import { Tags } from '@froq/ui'
import '@froq/ui/tokens.css'

const items: TagItem[] = [
  { value: 'claimed', label: 'Claimed' },
  { value: 'stalled', label: 'Stalled over 14 days', tone: 'accent' },
  { value: 'later', label: 'Later · 14:32', pending: true },
]
</script>

<template>
  <div class="ui">
    <Tags
      label="Contribution"
      :items="items"
    />
  </div>
</template>
```
