---
title: Button
designStatus: ai-draft
description: 采用统一轻量表面样式的原生按钮。
props:
  - name: type
    type: "'button' | 'submit' | 'reset'"
    default: button
    description: 原生按钮类型。
slots:
  - name: default
    description: 按钮内容。
---

Button 渲染为原生 `<button>`。使用默认插槽放置按钮文字或内容。组件没有显式声明 `disabled` 属性，但 Vue 会自动将 `disabled`、`name`、`aria-label` 等未声明属性透传到根 button。

## 用法

```vue
<script setup lang="ts">
import { Button } from '@froq/ui'
</script>

<template>
  <div class="ui">
    <Button type="button">
      保存
    </Button>
  </div>
</template>
```
