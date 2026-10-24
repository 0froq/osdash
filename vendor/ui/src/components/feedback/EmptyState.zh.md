---
title: EmptyState
designStatus: ai-draft
description: 说明空结果并提供后续操作的标题区块。
props:
  - name: title
    type: string
    required: true
    description: 为区块命名的可见标题。
  - name: description
    type: string
    description: 标题下方的可选说明文字。
slots:
  - name: default
    description: 空状态区块的补充内容。
  - name: actions
    description: 空状态区块的可选操作。
---

EmptyState 渲染一个由可见 `<h2>` 命名的 `<section>`，并可附带说明文字、补充内容和操作。它是区块级原语，不是整页布局。组件不提供 live region 或 status 语义；如果状态更新需要播报，应由消费端提供合适的播报行为。

## 用法

```vue
<script setup lang="ts">
import { Button, EmptyState } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <EmptyState
      title="还没有收藏的文档"
      description="收藏文档后，可以在这里找到它们。"
    >
      <template #actions>
        <Button type="button">
          浏览文档
        </Button>
      </template>
    </EmptyState>
  </div>
</template>
```
