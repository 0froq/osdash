---
title: Badge
designStatus: ai-draft
description: 使用弱化或强调色调的小型行内标签。
props:
  - name: tone
    type: "'muted' | 'accent'"
    default: muted
    description: 标签的视觉色调。
slots:
  - name: default
    description: 简短标签内容。
---

Badge 渲染为用于短行内标签的 `<span>`。通过默认插槽提供内容，并选择弱化或强调色调。它不是按钮，也不会自动添加 status 或 live region 语义；具体含义由周围内容表达。

## 用法

```vue
<script setup lang="ts">
import { Badge } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <Badge>草稿</Badge>
    <Badge tone="accent">
      已更新
    </Badge>
  </div>
</template>
```
