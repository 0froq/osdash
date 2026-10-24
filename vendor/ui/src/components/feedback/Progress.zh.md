---
title: Progress
designStatus: ai-draft
description: 使用原生进度元素展示确定或不确定的进度。
props:
  - name: label
    type: string
    required: true
    description: 设置原生 progress 元素的无障碍名称。
  - name: value
    type: number
    description: 当前进度。省略或传入非有限数值时为不确定进度；有限数值会被限制在零到 max 之间。
  - name: max
    type: number
    default: "100"
    description: 进度上限。非有限或非正数值会回退为 100。
---

Progress 渲染原生 `<progress>` 元素，并将 `label` 设为它的 `aria-label`。有限的 `value` 会被限制在零到规范化后 `max` 的范围内。省略 `value` 或传入非有限数值时，原生元素进入不确定进度状态。无效的 `max` 会被规范化为 100。

组件没有 `v-model` 或插槽。样式只使用 UI 库 token，不依赖字体、路由或业务状态。在调用方引入 `style.css`，并将组件放在带有 `class="ui"` 的元素内。

## 用法

```vue
<script setup lang="ts">
import { Progress } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <Progress
      label="正在上传文件"
      :value="3"
      :max="5"
    />
    <Progress label="正在加载结果" />
  </div>
</template>
```
