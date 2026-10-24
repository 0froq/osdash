---
title: Popover
designStatus: ai-draft
description: 锚定在触发按钮或外部元素上的非模态浮层面板。
model:
  type: boolean
  default: "false"
  description: 浮层是否打开。
props:
  - name: reference
    type: HTMLElement
    description: 外部锚点元素，替代内置触发按钮；调用方通过 v-model 控制打开。
  - name: label
    type: string
    required: true
    description: 浮层内容的无障碍名称，也是默认触发按钮文案。
  - name: closeLabel
    type: string
    required: true
    description: 内置关闭按钮的无障碍名称。
  - name: triggerLabel
    type: string
    description: 未提供 trigger 插槽时的按钮文案，默认使用 label。
  - name: disabled
    type: boolean
    default: "false"
    description: 禁用触发按钮。
  - name: side
    type: "'top' | 'right' | 'bottom' | 'left'"
    default: bottom
    description: 相对触发按钮的首选方向；发生碰撞时位置可能调整。
  - name: align
    type: "'start' | 'center' | 'end'"
    default: start
    description: 相对触发按钮的首选对齐方式；发生碰撞时位置可能调整。
  - name: sideOffset
    type: number
    default: "8"
    description: 触发按钮与内容之间的像素距离。
  - name: portalTo
    type: string | HTMLElement
    description: Teleport 目标。默认使用最近的消费者 class 为 ui 的元素；找不到时以内联方式渲染。
slots:
  - name: trigger
    description: 可选的单个真实 button，或会转发属性的按钮组件。
  - name: default
    description: 浮层内容；插槽参数提供 close 函数。
---

Popover 是锚定在触发按钮上的非模态面板。trigger 插槽必须最终渲染为单个真实按钮；若使用按钮组件，它必须转发 primitive 传入的属性和事件。默认插槽接收 `{ close }`。调用 `close()`、按 Escape 或在面板外交互都会关闭浮层。关闭时内容会卸载。

面板优先使用 `side` 和 `align`，并在发生视口碰撞时自动调整，碰撞边缘留有 12 像素间距。`disabled` 只作用于触发按钮。未声明的属性会转发给内容面板，不会转发给触发按钮。组件根节点不会添加 `.ui` 类。

默认情况下，内容会 Teleport 到最近的消费者 `class="ui"` 元素；找不到时则以内联方式渲染。在服务端只渲染触发按钮，打开后才会在客户端显示浮层内容。自定义 `portalTo` 目标必须已经存在，并由消费者提供主题和 UI token。Reka UI 的 CSS 变量不属于本库 token 契约。

Popover 不是菜单、tooltip 或模态对话框。复杂内容及其业务行为应留在调用方。在调用方引入 `style.css`，并提供 `.ui` 祖先元素，以供库样式和默认 portal 目标使用。

## 用法

代码片段等由调用方管理的目标可以通过 `reference` 传入 DOM 元素，并通过
`v-model` 控制浮层；此时不渲染触发按钮。悬停计时和焦点恢复由调用方负责。
需要让焦点留在目标上时，可以阻止内容的 `open-auto-focus` 和 `close-auto-focus` 事件。

```vue
<script setup lang="ts">
import { Button, Popover } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)
</script>

<template>
  <div class="ui">
    <Popover
      v-model="open"
      label="发布状态"
      close-label="关闭状态"
    >
      <template #trigger>
        <Button>发布状态</Button>
      </template>
      <template #default="{ close }">
        <p>本文档仍是草稿。</p>
        <Button @click="close">
          知道了
        </Button>
      </template>
    </Popover>
  </div>
</template>
```
