---
title: Collapsible
designStatus: ai-draft
description: 由模型控制、关闭时仍保留内容的无障碍折叠面板。
model:
  type: boolean
  default: "false"
  description: 面板是否打开。
props:
  - name: label
    type: string
    required: true
    description: 内置触发按钮的文字；自定义 trigger 插槽时由插槽提供内容。
  - name: disabled
    type: boolean
    default: "false"
    description: 禁止用户触发切换。
slots:
  - name: trigger
    description: 接收 open 和 props（CollapsibleTriggerProps）；须将完整 props 绑定到触发按钮。
  - name: default
    description: 面板内容，接收当前 open 布尔值，关闭时仍保持挂载。
---

Collapsible 是受控折叠面板：`v-model` 为布尔值，默认关闭。原生触发按钮支持 Enter 和 Space。面板关闭时，如果焦点位于面板内部，焦点会返回触发按钮。面板始终保持挂载，关闭时会设置 `hidden`、`inert` 和 `aria-hidden`。因此默认插槽中的生命周期钩子和其他副作用仍会运行。

`disabled` 只阻止用户触发切换，不阻止父组件修改模型。使用 trigger 插槽时，必须将完整的 `props` 对象绑定到真实 button，以保留生成的 `id`、`type`、`disabled`、ARIA 属性、class 和点击处理器。触发按钮通过 `aria-controls` 关联面板生成的 ID。

面板展开时，触发器为 `position: sticky; top: 0`，会一直钉在顶部，直到面板结束，就像代码编辑器里钉住当前所在层级的标题；标题下方有一小段渐隐，内容滑到它下面时逐渐淡出。它不需要自己的滚动容器，但祖先元素不能用 `overflow: hidden`、`auto` 或 `scroll` 裁剪它（改用 `overflow: clip`）。宿主页面顶部有固定栏时，用栏的高度覆盖 `.ui-collapsible.is-open > .ui-collapsible-trigger` 的 `top`。

内置触发器在标题后面画一条细线。悬停时强调色沿这条线长出；展开或键盘聚焦时，整条线收成强调色。面板高度会缓动展开和收起，内容始终保持挂载。减少动态效果偏好会关掉细线、箭头和高度过渡。它不实现 Accordion 或自动分组行为。面板内容和业务状态由消费端负责。

## 用法

```vue
<script setup lang="ts">
import { Collapsible } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)
</script>

<template>
  <div class="ui">
    <Collapsible
      v-model="open"
      label="安装详情"
    >
      <template #trigger="{ open: isOpen, props }">
        <button v-bind="props">
          {{ isOpen ? '隐藏' : '显示' }}安装详情
        </button>
      </template>
      <template #default="{ open: isOpen }">
        <p>{{ isOpen ? '面板已打开。' : '面板已关闭。' }}</p>
        <button
          type="button"
          @click="open = false"
        >
          在面板内关闭
        </button>
      </template>
    </Collapsible>
  </div>
</template>
```

无样式行为可通过 `@froq/ui/vue` 中的 `useDisclosure(open, disabled?)` 复用。它返回 `toggle(event?)`；禁用时或事件已被 `preventDefault` 时不会切换。
