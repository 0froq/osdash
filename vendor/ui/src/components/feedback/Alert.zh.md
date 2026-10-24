---
title: Alert
designStatus: ai-draft
description: 支持可选动态播报和关闭操作的行内消息。
props:
  - name: title
    type: string
    description: 显示在默认插槽内容上方的可选标题。
  - name: announcement
    type: "'polite' | 'assertive' | 'off'"
    default: polite
    description: 选择礼貌播报、紧急播报或不启用动态播报语义。
  - name: dismissLabel
    type: string
    description: 关闭按钮的无障碍名称。未提供此属性时不渲染按钮。
events:
  - name: dismiss
    payload: void
    description: 激活关闭按钮时无参数触发。组件不会自行隐藏或移动焦点。
slots:
  - name: default
    description: 提示消息内容。
---

Alert 显示可选的 `title` 和默认插槽内容。`announcement` 默认为 `polite`，使用 `status` 动态区域；`assertive` 使用 `alert` 角色；`off` 不启用动态播报语义。对于初始服务端 HTML 中就存在的提示，不能保证辅助技术会播报。适合时使用动态播报；但动态播报不能替代持续可见的重要警告。

提供 `dismissLabel` 后会显示关闭按钮。激活按钮会无参数触发 `dismiss` 事件。组件不会自行隐藏、管理可见状态或移动焦点；这些操作以及关闭后的焦点位置由调用方处理。

组件没有 `v-model`。样式只使用 UI 库 token，不依赖字体、路由或业务状态。在调用方引入 `style.css`，并将组件放在带有 `class="ui"` 的元素内。

## 用法

```vue
<script setup lang="ts">
import { Alert } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const visible = ref(true)
</script>

<template>
  <div class="ui">
    <Alert
      v-if="visible"
      title="连接已恢复"
      dismiss-label="关闭提示"
      @dismiss="visible = false"
    >
      更改已保存。
    </Alert>
  </div>
</template>
```
