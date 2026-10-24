---
title: HoverCard
designStatus: ai-draft
description: 为现有链接提供延迟显示的非交互预览。
model:
  type: boolean
  default: "false"
  description: 预览打开状态。disabled 会隐藏预览，但不会改写此模型。
props:
  - name: label
    type: string
    required: true
    description: 未提供 trigger 插槽时显示的触发文案。
  - name: href
    type: string
    required: true
    description: 触发链接的目标地址。
  - name: disabled
    type: boolean
    default: "false"
    description: 阻止打开预览，但不禁用链接或改变模型。
  - name: openDelay
    type: number
    default: "700"
    description: 打开前的毫秒延迟。有限值会限制为不小于零；无效值回退为 700。
  - name: closeDelay
    type: number
    default: "300"
    description: 关闭前的毫秒延迟。有限值会限制为不小于零；无效值回退为 300。
  - name: side
    type: "'top' | 'right' | 'bottom' | 'left'"
    default: bottom
    description: 相对链接的首选方向；碰撞处理可能重新定位预览。
  - name: align
    type: "'start' | 'center' | 'end'"
    default: start
    description: 相对链接的首选对齐方式；碰撞处理可能重新定位预览。
  - name: sideOffset
    type: number
    default: "8"
    description: 链接与预览之间的像素距离。
  - name: portalTo
    type: string | HTMLElement
    description: Teleport 目标。默认使用最近的消费者 class 为 ui 的元素；找不到时以内联方式渲染。
slots:
  - name: trigger
    description: 可选的单个真实锚点，或会转发锚点属性、事件和 href 的组件。
  - name: default
    description: 必需的非交互信息预览内容；该内容对辅助技术隐藏。
---

HoverCard 将必填的 `href` 链接与延迟显示的信息预览组合起来。预览不能替代链接内容：链接本身负责提供无障碍名称，并包含所有必要信息。未提供 trigger 插槽时，`label` 只作为可见触发文案。若使用 trigger 插槽，必须渲染一个真实锚点，或能转发收到的属性、事件和 `href` 的组件；插槽内容还需为链接提供无障碍名称。

必需的默认插槽只用于非必要的预览信息，并被标记为 `aria-hidden="true"`，辅助技术不会读取它。不要在预览中放置按钮、链接、表单字段或其他交互控件。操作使用 Popover，简短说明使用 Tooltip。

布尔 `v-model` 默认值为 `false`。`openDelay` 默认 700ms，`closeDelay` 默认 300ms。有限值会限制为不小于零；非有限值回退为对应默认值。HoverCard 使用 Reka UI 的悬停和焦点行为，包括延迟、指针移动和文本选择处理。获得焦点后会在 `openDelay` 后打开预览，失去焦点后会在 `closeDelay` 后关闭。在触屏设备上链接仍然是普通链接；没有单独的触屏打开预览行为。

`disabled` 会阻止预览打开，但不会禁用锚点，也不会强制把父级模型设为 `false`。若模型已为 true，disabled 期间预览会隐藏，同时保留模型值。预览优先使用 `side`、`align` 和 `sideOffset`，并自动避让碰撞区域，留出 12 像素间距。未声明属性会转发给预览内容，不会传给链接。组件根节点不会添加 `.ui` 类。

默认情况下，预览内容会 Teleport 到最近的消费者 `class="ui"` 元素；找不到时以内联方式渲染。SSR 时只渲染触发链接；客户端打开后才显示预览，关闭时会卸载预览。自定义 `portalTo` 目标必须已经存在，并由消费者提供主题和 UI token。在调用方引入 `style.css`，并提供 `.ui` 祖先元素，以供库样式和默认 portal 目标使用。

## 用法

```vue
<script setup lang="ts">
import { HoverCard } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)
</script>

<template>
  <div class="ui">
    <HoverCard
      v-model="open"
      label="查看个人资料"
      href="/people/ada"
      :open-delay="700"
      :close-delay="300"
    >
      <template #trigger>
        <a> Ada Lovelace </a>
      </template>
      <p>数学家和作家。</p>
    </HoverCard>
  </div>
</template>
```
