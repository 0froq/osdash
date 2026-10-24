---
title: Skeleton
designStatus: ai-draft
description: 在加载时保留组件布局的单个占位表面。
props:
  - name: loading
    type: boolean
    default: "true"
    description: 加载时显示占位表面并隐藏插槽内容。
  - name: shape
    type: "'block' | 'text' | 'circle'"
    default: block
    description: 表面形状。circle 应由调用方设置相等的宽和高。
  - name: animation
    type: "'pulse' | false"
    default: pulse
    description: 是否启用脉冲动画。减少动态效果偏好会禁用该动画。
  - name: width
    type: string | number
    description: CSS 宽度；数字按像素解释。
  - name: height
    type: string | number
    description: CSS 高度；数字按像素解释。
slots:
  - name: default
    description: 可选内容；加载时会隐藏，但保留其几何布局。
---

Skeleton 为一个组件区域绘制单个占位表面；它不会推断或生成多行加载列表。提供默认插槽时，插槽内容在加载期间仍保持挂载，只是隐藏，并设置为 inert 和 `aria-hidden`；它的布局仍决定预留空间。插槽的生命周期钩子、网络请求和其他副作用仍会执行，因此不要把耗费较大的异步渲染本身放在插槽里。

不提供插槽时，使用 `width`、`height` 或调用方的 CSS（例如 `aspect-ratio`）预留预期尺寸。加载结束后也保留相同尺寸；如果只在加载时设置高度，内容出现时布局会变化。circle 需要调用方提供相等的宽和高。text 形状是一条占位条，不会自动生成段落。无插槽的外层最小高度为 `1lh`；带插槽时内容包装层使用 `flow-root`。

Skeleton 只负责视觉呈现，不读取字体、路由或网络状态。`aria-busy` 反映 `loading`，但不会播报加载消息；消费端应提供合适的状态描述。减少动态效果偏好会禁用脉冲动画。Skeleton 不会动画宽高，也无法保证任意字体替换或未知内容高度下完全没有布局偏移。

## 用法

```vue
<script setup lang="ts">
import { Skeleton } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <Skeleton
      :loading="true"
      width="14rem"
      height="6rem"
    >
      <div>
        <h2>账户详情</h2>
        <p>个人资料信息将在这里显示。</p>
      </div>
    </Skeleton>
  </div>
</template>
```
