---
title: Spinner
designStatus: ai-draft
description: 用于表示任务正在进行的动态状态指示器。
props:
  - name: label
    type: string
    required: true
    description: 状态指示器的无障碍名称。
---

Spinner 渲染一个带有所需无障碍名称 `label` 的状态区域。可以在组件或祖先元素上设置 `font-size` 来控制尺寸；圆环会按当前字号缩放。系统启用减少动态效果时，圆环动画会停止。

组件没有 `v-model` 或插槽。样式只使用 UI 库 token，不依赖字体、路由或业务状态。在调用方引入 `style.css`，并将组件放在带有 `class="ui"` 的元素内。

## 用法

```vue
<script setup lang="ts">
import { Spinner } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <Spinner
      label="正在加载结果"
      style="font-size: 1.25rem"
    />
  </div>
</template>
```
