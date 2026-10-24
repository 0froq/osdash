---
title: Separator
designStatus: ai-draft
description: 用于视觉分隔或语义分隔内容的分隔线。
props:
  - name: orientation
    type: "'horizontal' | 'vertical'"
    default: horizontal
    description: 分隔线方向。垂直分隔线会拉伸到父元素高度。
  - name: decorative
    type: boolean
    default: "true"
    description: 为 true 时使用 presentation 语义；否则暴露带方向的 separator。
---

Separator 渲染一条分隔线。默认方向为水平，且为装饰元素，使用 `role="presentation"`。设置 `decorative="false"` 后会使用 `role="separator"`，并暴露所选的 `aria-orientation`。组件不会移动或管理焦点。

使用垂直分隔线时，父级布局需要提供高度，以便它拉伸到父元素高度。组件没有插槽或 `v-model`。样式只使用 UI 库 token，不依赖字体、路由或业务状态。在调用方引入 `style.css`，并将组件放在带有 `class="ui"` 的元素内。

## 用法

```vue
<script setup lang="ts">
import { Separator } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <span>Editorial</span>
    <Separator />
    <div style="display: flex; height: 2rem; align-items: center; gap: 1rem">
      <span>Notes</span>
      <Separator orientation="vertical" />
      <span>Archive</span>
    </div>
  </div>
</template>
```
