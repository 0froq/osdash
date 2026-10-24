---
title: Avatar
designStatus: ai-draft
description: 固定尺寸的头像图片，带加载占位和文本回退。
props:
  - name: label
    type: string
    required: true
    description: 头像图片的无障碍名称。
  - name: fallback
    type: string
    required: true
    description: 未提供图片源或图片加载失败时显示的文本。
  - name: src
    type: string
    description: 可选图片源。
  - name: loading
    type: "'lazy' | 'eager'"
    default: lazy
    description: 原生图片加载策略，不是控制骨架屏显示的开关。
---

Avatar 使用直径 40px 的圆形根元素，设置 `role="img"`，并将必填的 `label` 作为无障碍名称。提供图片源时，加载期间显示共享 Skeleton；成功后显示图片；未提供图片源或加载失败时显示 `fallback`。组件会在挂载后检查缓存图片是否已完成加载，并在 `src` 改变时重置加载状态。

`loading` 设置原生图片的加载策略（`lazy` 或 `eager`），不会控制 Skeleton。根元素没有插槽或 `v-model`。可以通过 `class` 或 `style` 覆盖根元素尺寸。样式只使用 UI 库 token，不依赖路由或业务状态。在调用方引入 `style.css`，并将 Avatar 放在带有 `class="ui"` 的元素内。

## 用法

```vue
<script setup lang="ts">
import { Avatar } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <Avatar
      label="Froq"
      fallback="fq"
      src="/people/froq.webp"
      loading="lazy"
    />
  </div>
</template>
```
