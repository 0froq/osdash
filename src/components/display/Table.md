---
title: Table
designStatus: ai-draft
description: A typed native table with optional header, cell, and empty-state slots.
props:
  - name: caption
    type: string
    required: true
    description: Visible native table caption and accessible name for the scroll region.
  - name: rows
    type: T[]
    required: true
    description: Data rows rendered by the table.
  - name: columns
    type: TableColumn<T>[]
    required: true
    description: Column definitions keyed by string properties of T.
  - name: rowKey
    type: (row: T) => string | number
    required: true
    description: Returns a unique, stable key for each row.
slots:
  - name: header
    description: Receives column and replaces the default column label.
  - name: cell
    description: Receives row, column, value, and zero-based index and replaces the default cell value.
  - name: empty
    description: Optional content rendered as one row when rows is empty.
---

Table is a generic native HTML table. It renders a `<caption>` and column headers with `scope="col"`. Its horizontally scrollable wrapper is a keyboard-focusable region named by `caption`. Undeclared attributes, including `class` and `style`, are forwarded to the `<table>`, not the scroll wrapper.

`TableColumn<T>` has a `key` from the string keys of `T`, a `label`, and optional `align` (`start`, `center`, or `end`). `header` receives `{ column }`; `cell` receives `{ row, column, value, index }`; `empty` renders when there are no rows and the slot is provided. Supply unique, stable `rowKey` values and typed columns so TypeScript keeps the column keys specific.

Table does not implement sorting, filtering, pagination, grid keyboard interaction, virtualization, or business state. Use it for tabular data and compose those behaviors in the consuming application. It has no `v-model`. Styles use the UI library tokens and do not depend on fonts, routes, or business state. Import `style.css` in the caller and place the component inside an element with `class="ui"`.

## Usage

```vue
<script setup lang="ts">
import type { TableColumn } from '@froq/ui/vue'
import { Badge, Table } from '@froq/ui'
import '@froq/ui/style.css'

interface DocumentRow {
  id: string
  title: string
  status: string
}

const rows: DocumentRow[] = [
  { id: 'one', title: 'Tokens and typography', status: 'Published' },
]
const columns: TableColumn<DocumentRow>[] = [
  { key: 'title', label: 'Document' },
  { key: 'status', label: 'Status', align: 'end' },
]
</script>

<template>
  <div class="ui">
    <Table
      caption="Recent documents"
      :rows="rows"
      :columns="columns"
      :row-key="row => row.id"
    >
      <template #cell="{ column, value }">
        <Badge v-if="column.key === 'status'">
          {{ value }}
        </Badge>
        <template v-else>
          {{ value }}
        </template>
      </template>
      <template #empty>
        No documents yet.
      </template>
    </Table>
  </div>
</template>
```
