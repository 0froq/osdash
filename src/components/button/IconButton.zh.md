---
title: IconButton
designStatus: ai-draft
description: 带无障碍名称和装饰性图标内容的按钮。
props:
  - name: label
    type: string
    required: true
    description: 设置到按钮上的无障碍名称。
  - name: type
    type: "'button' | 'submit' | 'reset'"
    default: button
    description: 原生按钮类型。
slots:
  - name: default
    description: 装饰性图标内容，会放在 aria-hidden 容器内。
---

IconButton 渲染为真实 button。默认插槽只放图标图案；插槽内容对辅助技术隐藏，不能放交互控件。必填的 `label` 为按钮提供无障碍名称。未声明的原生属性和事件监听器会透传到按钮。切换按钮的 `aria-pressed` 由消费端传入；IconButton 不管理按下状态，也不提供 tooltip。

## 用法

```vue
<script setup lang="ts">
import { IconButton } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <IconButton
      label="收藏文档"
      type="button"
      aria-pressed="false"
      @click="console.info('点击收藏')"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M6 3h12v18l-6-4-6 4z" />
      </svg>
    </IconButton>
  </div>
</template>
```
