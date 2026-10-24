---
title: GridTable
designStatus: ai-draft
description: A matrix-style grid with a header row, sticky row headers, and data cells.
props:
  - name: label
    type: string
    required: true
    description: Accessible name for the grid group.
  - name: rows
    type: TRow[]
    required: true
    description: Data rows. Each row renders one row header and one cell per column.
  - name: rowKey
    type: (row: TRow) => string | number
    required: true
    description: Returns a unique, stable key for each row.
  - name: columns
    type: TColumn[]
    required: true
    description: Data columns. Their count sets how many tracks the grid has.
  - name: columnKey
    type: (column: TColumn) => string | number
    required: true
    description: Returns a unique, stable key for each column.
  - name: current
    type: string | number
    description: Key of the column to highlight. Cells in that column get the current style.
  - name: rowHeight
    type: string
    description: Minimum height of each row, as a CSS length. Defaults to 48px.
  - name: columnWidth
    type: string
    description: Minimum width of each data column, as a CSS length. Defaults to 7rem.
  - name: crosshair
    type: boolean
    description: Highlights the hovered cell row and column, including the row header. Mouse only. Defaults to true.
slots:
  - name: header
    description: Content for the top row. It spans the data columns, usually with a Choice.
  - name: row-header
    description: Receives row. Renders the sticky first cell of each row.
  - name: cell
    description: Receives row and column. Renders each data cell.
---

GridTable is a generic CSS grid for matrix-style tables, such as choosing a variant for each row item. The first column stays visible while the grid scrolls horizontally, and a fade marks where it pins. The header row is always rendered, so a `header` slot without content leaves an empty top row.

The component does not hold selection state. Pass the selected column with `current` and bind the header control yourself, for example with a `Choice` and `v-model`. Each `cell` is caller content, so put links, buttons, or text inside it. Focus outlines apply to links inside the grid.

Undeclared attributes, including `class` and `style`, are forwarded to the grid root. Use `class` to add project layout such as margins. The component has no sorting, filtering, virtualization, or business state. Styles use only UI library tokens and do not depend on fonts, routes, or business state. Import `style.css` in the caller and place the component inside an element with `class="ui"`.

## Usage

```vue
<script setup lang="ts">
import type { ChoiceOption } from '@froq/ui/vue'
import { Choice, GridTable } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

interface PortRow {
  id: string
  title: string
}
interface VariantColumn {
  id: string
  label: string
}

const rows: PortRow[] = [{ id: 'vim', title: 'Vim' }]
const columns: VariantColumn[] = [
  { id: 'full', label: 'Full' },
  { id: 'lite', label: 'Lite' },
]
const options: ChoiceOption<string>[] = columns.map(column => ({ value: column.id, label: column.label }))
const variant = ref('full')
</script>

<template>
  <div class="ui">
    <GridTable
      label="Ports by variant"
      :rows="rows"
      :row-key="row => row.id"
      :columns="columns"
      :column-key="column => column.id"
      :current="variant"
    >
      <template #header>
        <Choice
          v-model="variant"
          :options="options"
        />
      </template>
      <template #row-header="{ row }">
        {{ row.title }}
      </template>
      <template #cell="{ row, column }">
        <a
          :href="`/ports/${row.id}-${column.id}.zip`"
          :title="`${row.title} ${column.label}`"
        >
          Download
        </a>
      </template>
    </GridTable>
  </div>
</template>
```
