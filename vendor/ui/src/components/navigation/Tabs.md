---
title: Tabs
designStatus: ai-draft
description: A keyboard-accessible tab list with persistent panels.
model:
  type: string
  required: true
  description: The value of the selected tab.
props:
  - name: items
    type: ChoiceOption[]
    required: true
    description: Tabs with stable, unique values, labels, and optional disabled state.
  - name: label
    type: string
    required: true
    description: Accessible name for the tab list.
  - name: orientation
    type: "'horizontal' | 'vertical'"
    default: horizontal
    description: Direction used to lay out the tabs and select keyboard arrows.
  - name: activation
    type: "'automatic' | 'manual'"
    default: automatic
    description: Whether arrow-key focus also selects a tab, or selection waits for activation.
slots:
  - name: label
    description: Receives item and active to replace the tab label; do not put interactive content here.
  - name: default
    description: Receives item and active for each persistent tab panel.
---

Tabs renders a tab list and a panel for every item. `items` values must be unique and stable. The required `v-model` is a string value. An invalid or disabled model value is not corrected automatically: the first enabled tab becomes the Tab entry point, but is not selected automatically. If the model matches a disabled item, its panel can remain visible. All panels stay mounted; inactive panels are hidden and inert.

Arrow keys follow `orientation`; horizontal arrows reverse in RTL. Home and End move focus to the first or last enabled tab. With `activation="automatic"`, arrow-key focus also selects the tab; with `manual`, arrows only move focus and Enter or Space selects using the native button behavior. Modified keys are not consumed. The label slot replaces text inside the tab button, so it is only for label content, not nested interactive controls. The default slot receives each panel's `item` and `active` state.

The unstyled keyboard and selection behavior is available through `useTabs` from `@froq/ui/vue`.

## Usage

```vue
<script setup lang="ts">
import { Tabs } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const active = ref('overview')
const items = [
  { value: 'overview', label: 'Overview' },
  { value: 'settings', label: 'Settings' },
]
</script>

<template>
  <div class="ui">
    <Tabs
      v-model="active"
      :items="items"
      label="Account sections"
      orientation="horizontal"
      activation="automatic"
    >
      <template #label="{ item }">
        {{ item.label }}
      </template>
      <template #default="{ item, active: selected }">
        <h2>{{ item.label }}</h2>
        <p>{{ selected ? 'This panel is selected.' : 'This panel is inactive.' }}</p>
      </template>
    </Tabs>
  </div>
</template>
```
