---
title: Table
designStatus: ai-draft
description: 提供表头、单元格和空状态插槽的类型化原生表格。
props:
  - name: caption
    type: string
    required: true
    description: 原生表格标题，同时作为滚动区域的无障碍名称。
  - name: rows
    type: T[]
    required: true
    description: 表格要显示的数据行。
  - name: columns
    type: TableColumn<T>[]
    required: true
    description: 以 T 的字符串属性为键的列定义。
  - name: rowKey
    type: (row: T) => string | number
    required: true
    description: 为每一行返回唯一且稳定的键。
slots:
  - name: header
    description: 接收 column，并替换默认列标签。
  - name: cell
    description: 接收 row、column、value 和从零开始的 index，并替换默认单元格值。
  - name: empty
    description: rows 为空时可选渲染为一行的内容。
---

Table 是泛型原生 HTML 表格。它渲染 `<caption>` 和带有 `scope="col"` 的列标题。表格外有可水平滚动且可通过键盘聚焦的区域，并使用 `caption` 作为无障碍名称。未声明的属性（包括 `class` 和 `style`）会转发给 `<table>`，不会传给滚动容器。

`TableColumn<T>` 包含一个取自 `T` 字符串键的 `key`、一个 `label`，以及可选的 `align`（`start`、`center` 或 `end`）。`header` 接收 `{ column }`；`cell` 接收 `{ row, column, value, index }`；没有数据行且提供了 `empty` 插槽时，会渲染该插槽。请提供唯一且稳定的 `rowKey`，并为列数组添加类型，让 TypeScript 保留具体的列键类型。

Table 不实现排序、筛选、分页、网格键盘交互、虚拟化或业务状态。它用于呈现表格数据，这些行为由调用方组合实现。组件没有 `v-model`。样式只使用 UI 库 token，不依赖字体、路由或业务状态。在调用方引入 `style.css`，并将组件放在带有 `class="ui"` 的元素内。

## 用法

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
