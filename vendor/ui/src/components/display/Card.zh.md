---
title: Card
designStatus: ai-draft
description: 带可选头部和页脚区域的简洁边框容器。
slots:
  - name: header
    description: 可选头部内容。
  - name: default
    description: 卡片主体内容。
  - name: footer
    description: 可选页脚内容。
---

Card 是带有 header、body 和 footer 插槽的简单 `<div>` 容器。它没有 props 或 model。根节点不是 `<article>`，也不决定业务卡片的含义或布局；标题、操作和内容由消费端提供。边框和表面样式使用库的 tokens。

## 用法

```vue
<script setup lang="ts">
import { Badge, Button, Card } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <Card>
      <template #header>
        <Badge>随手记录</Badge>
      </template>
      <h2>观察</h2>
      <p>收集日常的小观察。</p>
      <template #footer>
        <Button type="button">
          阅读记录
        </Button>
      </template>
    </Card>
  </div>
</template>
```
