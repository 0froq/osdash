---
title: Tags
designStatus: ai-draft
description: 可换行的一组安静文字，陈述某个对象的事实，每项带一个小的前缘标记。
props:
  - name: items
    type: TagItem[]
    required: true
    description: 按顺序排列的标签。每项有 `value` 和 `label`，可设置 `tone`、`pending`、`href`、`external`。空数组不渲染任何内容。
  - name: label
    type: string
    description: 为辅助技术给列表命名。
events:
  - name: activate
    payload: TagItem, MouseEvent
    description: 点击标签链接时触发，携带该项和原始事件。列表放在可点击的容器里时，在事件上调用 `stopPropagation()`。
slots:
  - name: tag
    description: '替换标签内容。作用域：`{ item }`。前缘标记和色调保留。'
---

Tags 陈述一个对象的事实：卡片、行、页头。它用来说明，不用来选择。读者要选值时用 Pick，需要一个带边框的状态标签时用 Badge。

每个标签是 meta 字体的文字，前缘带一个小胶囊，和 Pick、Sidebar 画的是同一个标记。胶囊默认是中性色。`tone: 'accent'` 把它变成强调色，并把文字提到前景色，留给一两个需要被看一眼的标签。要克制使用：多数标签都是 accent 时，就没有哪个突出了。

`pending` 画虚线下划线，表示仍未完成。带 `href` 的标签是链接，加 `external` 会在新标签页打开且不带 referrer。列表是真正的 `<ul>`，辅助技术能读出数量。

## 用法

```vue
<script setup lang="ts">
import type { TagItem } from '@froq/ui'
import { Tags } from '@froq/ui'
import '@froq/ui/tokens.css'

const items: TagItem[] = [
  { value: 'claimed', label: '已认领' },
  { value: 'stalled', label: '停滞超过 14 天', tone: 'accent' },
  { value: 'later', label: '稍后 · 14:32', pending: true },
]
</script>

<template>
  <div class="ui">
    <Tags
      label="贡献"
      :items="items"
    />
  </div>
</template>
```
