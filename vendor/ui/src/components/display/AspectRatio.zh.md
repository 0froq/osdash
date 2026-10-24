---
title: AspectRatio
designStatus: ai-draft
description: 用固定宽高比容纳媒体或其他定位内容。
props:
  - name: ratio
    type: number
    default: "16 / 9"
    description: 宽高比。非有限或非正数值会回退为 1。
  - name: fit
    type: "'cover' | 'contain'"
    default: cover
    description: 直接子级 img 和 video 的 object-fit 值。
slots:
  - name: default
    description: 放入比例容器的媒体或其他内容。
---

AspectRatio 将根容器固定为指定的宽高比 `ratio`，默认是 16:9。非有限或非正数值会回退为 1:1。子级内容区域采用绝对定位，因此插槽内容不会决定或撑高根容器。

默认插槽可放媒体或任意内容。`fit` 默认 `cover`；`contain` 会应用于直接子级 `img` 和 `video`。直接子级 iframe 仍使用 `object-fit: cover`；调用方需为 iframe 提供合适的标题，并自行处理其内容与加载。AspectRatio 不管理加载状态；媒体的 `src`、`alt` 和加载行为由调用方提供。组件没有 `v-model`。

样式只使用 UI 库 token，不依赖字体、路由或业务状态。在调用方引入 `style.css`，并将组件放在带有 `class="ui"` 的元素内。

## 用法

```vue
<script setup lang="ts">
import { AspectRatio } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div
    class="ui"
    style="width: min(100%, 20rem)"
  >
    <AspectRatio
      :ratio="16 / 9"
      fit="contain"
    >
      <img
        src="/media/cover.webp"
        alt="湖面倒映着山脉"
        loading="lazy"
      >
    </AspectRatio>
  </div>
</template>
```
