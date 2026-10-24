---
title: Drawer
designStatus: ai-draft
description: 固定在左、右或底部边缘的对话框面板。
model:
  type: boolean
  default: "false"
  description: 抽屉是否打开。
props:
  - name: title
    type: string
    required: true
    description: 可见的抽屉标题。
  - name: closeLabel
    type: string
    required: true
    description: 内置关闭按钮的无障碍名称。
  - name: description
    type: string
    description: 与对话框内容关联的可选可见描述。
  - name: triggerLabel
    type: string
    default: title
    description: 未提供 trigger 插槽时的触发按钮文案，默认使用 title。
  - name: showTrigger
    type: boolean
    default: "true"
    description: 是否渲染内置触发器及 trigger 插槽；为 false 时两者都不渲染。
  - name: returnFocus
    type: HTMLElement
    description: 关闭后接收焦点的可选可聚焦元素，优先于捕获到的打开前焦点。
  - name: disabled
    type: boolean
    default: "false"
    description: 仅禁用触发按钮；父组件仍可通过模型打开抽屉。
  - name: dismissible
    type: boolean
    default: "true"
    description: 显示内置关闭按钮，并允许 Escape 或外部交互关闭。
  - name: closeOnOutside
    type: boolean
    default: "true"
    description: dismissible 为 true 时，是否允许外部交互关闭抽屉。
  - name: portalTo
    type: "string | HTMLElement"
    description: Teleport 目标。默认使用最近的 ui 类祖先；找不到时客户端内联渲染。
  - name: side
    type: "'left' | 'right' | 'bottom'"
    default: right
    description: 固定的物理边缘；left/right 不会按 RTL 翻转。
slots:
  - name: trigger
    description: 可选的单个按钮子节点；使用原生 button 或会透传 attrs 及 button ref 的组件。
  - name: default
    description: 抽屉主体，接收 close()；关闭时会卸载。
  - name: footer
    description: 可选页脚内容，接收 close()。
events:
  - name: openAutoFocus
    payload: Event
    description: 通过未声明属性转发给 Dialog；同步触发且可取消。
  - name: closeAutoFocus
    payload: Event
    description: 通过未声明属性转发给 Dialog；同步触发且可取消。
---

Drawer 复用 Dialog 的受控布尔 `v-model`、关闭按钮、Escape/外部关闭、模态焦点处理和插槽 `close()`。默认 `showTrigger="true"` 时，Reka 内置触发器提供默认焦点返回目标；`disabled` 只禁用这个内置触发器，外部控件需由消费端自行禁用。使用外部控制的模态流程时设为 `showTrigger="false"`，内置触发器和 trigger 插槽都不渲染。此模式下，层会在 `openAutoFocus` 事件中、默认焦点移动前捕获非 `body` 的活动元素；它不会监听所有可能的打开动作。如果消费端在该事件前已自行移动焦点到内容中，必须显式传入 `returnFocus`。该值必须是可聚焦的 `HTMLElement`；helper 不会为普通元素补 `tabindex`。

`showTrigger="false"` 时，焦点恢复优先使用有效的 `returnFocus`，其次尝试捕获到的打开前元素。目标必须仍连接在文档中、未禁用、未处于 hidden 或 inert 子树内，并具有布局；两者都无效时，组件不会猜测页面级后备焦点。显示内置触发器时，默认焦点返回由 Reka UI 处理。Drawer 会把未声明属性（包括 `@open-auto-focus` 和 `@close-auto-focus`）转发给 Dialog；它们接收同步可取消的 DOM 事件，需同步调用 `preventDefault()`。若外部候选焦点都不合适，可用 `@close-auto-focus.prevent` 接管焦点恢复。`dismissible` 控制关闭按钮以及 Escape/外部关闭。dismissible 为 true 时，将 `closeOnOutside` 设为 false 会阻止外部关闭，但保留关闭按钮和 Escape。父组件更新模型和插槽 `close()` 始终可以关闭抽屉。

`side` 将面板固定在物理左、右或底部边缘；left/right 不会自动按 RTL 翻转。左右面板宽度为 `min(26rem, calc(100vw - 24px))`，高度为 `100dvh`。底部面板占满视口宽度，高度由内容决定，最大为 `calc(100dvh - 24px)`。抽屉不添加滑动或拖动手势、高度动画或页面目录行为。

未声明的属性（包括 `class`、`style` 和焦点事件监听器）会透传到对话框内容。默认 portal 目标是最近的消费端 `.ui` 祖先；找不到时客户端内联渲染。SSR 时仅在 `showTrigger` 为 true 时渲染内置触发器，不会渲染 portal 内容。自定义 `portalTo` 目标必须存在，并由消费端提供主题和 UI token。根节点不会自行添加 `.ui`。对话框关闭时内容会卸载；需要保留的状态应由消费端保存。

## 用法

```vue
<script setup lang="ts">
import { Drawer } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)
</script>

<template>
  <div class="ui">
    <Drawer
      v-model="open"
      title="筛选"
      close-label="关闭筛选"
      side="right"
    >
      <template #default="{ close }">
        <p>选择要显示的结果。</p>
        <button
          type="button"
          @click="close"
        >
          完成
        </button>
      </template>
    </Drawer>
  </div>
</template>
```
