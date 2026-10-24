---
title: Breadcrumb
designStatus: ai-draft
description: 显示当前路径的有序导航层级。
props:
  - name: label
    type: string
    required: true
    description: nav landmark 的无障碍名称。
  - name: items
    type: NavigationItem[]
    required: true
    description: 有序条目，包含唯一 value、label 和可选 href。
  - name: current
    type: string
    default: last item value
    description: 当前条目的 value；默认使用最后一项的 value。
slots:
  - name: link
    description: 仅用于带 href 的条目，接收 item 和 props（BreadcrumbLinkProps：class、href、aria-current）；不含点击处理器。
---

Breadcrumb 在带标签的 `<nav>` landmark 中渲染有序列表。带 `href` 的条目渲染为链接；没有 `href` 的条目渲染为普通文本。value 与 `current` 匹配的条目会在链接或文本上获得 `aria-current="page"`。默认以最后一项为当前项。若 `current` 不匹配任何条目，则没有条目会标记为当前项。

条目的 value 必须唯一。可选的 `link` 插槽只用于带 `href` 的条目；它接收 `item` 和包含 `class`、`href`、`aria-current` 的 `props`，不提供点击处理器。路由或本地化链接需要由消费端适配传入的 href。Breadcrumb 不会生成路径，也不会截断导航层级。未声明的属性会应用到 `<nav>` 元素。

## 用法

```vue
<script setup lang="ts">
import { Breadcrumb } from '@froq/ui'
import '@froq/ui/style.css'

const items = [
  { value: 'docs', label: '文档', href: '/docs' },
  { value: 'guide', label: '指南', href: '/docs/guide' },
  { value: 'current', label: '当前页面' },
]
</script>

<template>
  <div class="ui">
    <Breadcrumb
      :items="items"
      label="面包屑导航"
    />
  </div>
</template>
```
