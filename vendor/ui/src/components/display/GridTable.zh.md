---
title: GridTable
designStatus: ai-draft
description: 矩阵式网格，包含表头行、粘性行头和数据单元格。
props:
  - name: label
    type: string
    required: true
    description: 网格组的无障碍名称。
  - name: rows
    type: TRow[]
    required: true
    description: 数据行。每一行渲染一个行头和每列一个单元格。
  - name: rowKey
    type: (row: TRow) => string | number
    required: true
    description: 为每一行返回唯一且稳定的键。
  - name: columns
    type: TColumn[]
    required: true
    description: 数据列。列数决定网格的轨道数。
  - name: columnKey
    type: (column: TColumn) => string | number
    required: true
    description: 为每一列返回唯一且稳定的键。
  - name: current
    type: string | number
    description: 需要高亮的列键。该列的单元格会获得当前态样式。
  - name: rowHeight
    type: string
    description: 每行的最小高度，使用 CSS 长度。默认为 48px。
  - name: columnWidth
    type: string
    description: 每个数据列的最小宽度，使用 CSS 长度。默认为 7rem。
  - name: crosshair
    type: boolean
    description: 高亮悬停单元格所在的行和列，包括行头。仅鼠标触发。默认为 true。
slots:
  - name: header
    description: 顶部行的内容，横跨数据列，通常放一个 Choice。
  - name: row-header
    description: 接收 row。渲染每行粘性的第一个单元格。
  - name: cell
    description: 接收 row 和 column。渲染每个数据单元格。
---

GridTable 是通用的 CSS 网格，用于矩阵式表格，例如为每个条目选择一个变体。网格水平滚动时第一列保持可见，并在固定位置显示渐隐提示。表头行始终渲染，因此不传内容的 `header` 插槽会留下一个空的顶部行。

组件不保存选中状态。用 `current` 传入选中的列，并由调用方绑定表头控件，例如用 `Choice` 配合 `v-model`。每个 `cell` 都是调用方内容，可以放链接、按钮或文本。网格内的链接会显示焦点轮廓。

未声明的属性（包括 `class` 和 `style`）会转发给网格根元素。用 `class` 添加项目的布局，例如外边距。组件没有排序、筛选、虚拟化或业务状态。样式只使用 UI 库 token，不依赖字体、路由或业务状态。在调用方引入 `style.css`，并将组件放在带有 `class="ui"` 的元素内。

## 用法

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
