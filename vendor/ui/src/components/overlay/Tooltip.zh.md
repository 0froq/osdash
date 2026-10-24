---
title: Tooltip
designStatus: ai-draft
description: 显示在可聚焦触发元素旁的简短文字提示。
model:
  type: boolean
  default: "false"
  description: 提示是否打开。
props:
  - name: text
    type: string
    required: true
    description: 简短且不含交互的提示文字。
  - name: disabled
    type: boolean
    default: "false"
    description: 禁止提示交互，但不禁用触发元素，也不阻止父组件更新模型。
  - name: delayDuration
    type: number
    default: "500"
    description: 毫秒延迟，最小为零；非有限值会回退到 500。
  - name: side
    type: "'top' | 'right' | 'bottom' | 'left'"
    default: top
    description: 相对触发元素的首选方向。
  - name: align
    type: "'start' | 'center' | 'end'"
    default: center
    description: 相对触发元素的首选对齐方式。
  - name: sideOffset
    type: number
    default: "8"
    description: 触发元素与提示内容之间的像素距离。
  - name: portalTo
    type: "string | HTMLElement"
    description: Teleport 目标。默认使用最近的消费者 class 为 ui 的元素；找不到时以内联方式渲染。
slots:
  - name: default
    description: 单个可聚焦的原生 button，或会转发触发属性及 button ref 的按钮组件。
---

Tooltip 在可聚焦触发元素旁显示简短文字。默认插槽必须最终渲染为一个真实 button，或能转发触发 primitive 所需属性和 button ref 的按钮组件。提示文字不能替代触发元素自身的无障碍名称；例如 `IconButton` 仍需要设置 `label` 属性。Tooltip 内容只有文字，不应放交互控件。

`disabled` 会禁止提示交互，但不会设置触发元素的原生 `disabled` 状态，也不会阻止父组件更新 `v-model`。`delayDuration` 会规范为大于等于零的有限数值；无效或非有限值使用 500 毫秒。每个 Tooltip 实例各自创建 provider，因此延迟仅作用于当前实例，不会由相邻 tooltip 共享。

未声明的属性会转发到提示内容，不会转发到触发元素。默认情况下，内容会 Teleport 到最近的消费者 `class="ui"` 元素；找不到时则在客户端以内联方式渲染。服务端只渲染触发元素，提示内容会在客户端显示。自定义 `portalTo` 目标必须存在，并由消费者提供主题和 UI token。Tooltip 根节点不会自行添加 `.ui` 类。

## 用法

```vue
<script setup lang="ts">
import { Tooltip } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)
</script>

<template>
  <div class="ui">
    <Tooltip
      v-model="open"
      text="复制链接"
      side="top"
      align="center"
      :side-offset="8"
      :delay-duration="500"
    >
      <button type="button">
        复制
      </button>
    </Tooltip>
  </div>
</template>
```
