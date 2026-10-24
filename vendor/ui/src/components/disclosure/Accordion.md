---
title: Accordion
designStatus: ai-draft
description: A group of collapsible panels with single or multiple open values.
model:
  type: string[]
  default: "[]"
  description: Values of the open items.
props:
  - name: items
    type: ChoiceOption[]
    required: true
    description: Items with stable, unique values and labels; each may be disabled.
  - name: multiple
    type: boolean
    default: "false"
    description: Allow more than one item to be open at a time.
  - name: disabled
    type: boolean
    default: "false"
    description: Disable toggling for every item.
slots:
  - name: default
    description: Panel content for each item; receives item and open.
---

Accordion composes Collapsible panels for a list of items. Its `v-model` is an array of open values and defaults to an empty array. In single mode (`multiple="false"`), only the first model value is treated as open; opening another item replaces it. In multiple mode, each listed value opens its panel. Either mode allows all panels to be closed. Item-level `disabled` values and the group `disabled` prop prevent user toggling.

Each trigger reuses Collapsible's native button behavior, including Enter and Space support and returning focus to the trigger when a panel closes while focus is inside it. Accordion does not force an ARIA accordion role or add arrow-key navigation between triggers. The default slot receives each item's `item` and `open` state.

## Usage

```vue
<script setup lang="ts">
import { Accordion } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const openItems = ref<string[]>([])
const items = [
  { value: 'shipping', label: 'Shipping' },
  { value: 'returns', label: 'Returns' },
]
</script>

<template>
  <div class="ui">
    <Accordion
      v-model="openItems"
      :items="items"
      :multiple="true"
    >
      <template #default="{ item, open }">
        <p>{{ item.label }} details {{ open ? 'are open.' : 'are closed.' }}</p>
      </template>
    </Accordion>
  </div>
</template>
```
