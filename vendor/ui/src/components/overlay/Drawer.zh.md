---
title: Drawer
designStatus: ai-draft
description: 固定在左、右或底部边缘的对话框面板。
model:
  type: boolean
  default: 'false'
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
    default: 'true'
    description: 是否渲染打开入口。handle 插槽会替代普通 trigger。为 false 时 trigger 和 handle 均不渲染。
  - name: returnFocus
    type: HTMLElement
    description: 关闭后接收焦点的可选可聚焦元素，优先于捕获到的打开前焦点。
  - name: disabled
    type: boolean
    default: 'false'
    description: 仅禁用触发按钮；父组件仍可通过模型打开抽屉。
  - name: dismissible
    type: boolean
    default: 'true'
    description: 显示内置关闭按钮，并允许 Escape 或外部交互关闭。
  - name: closeOnOutside
    type: boolean
    default: 'true'
    description: dismissible 为 true 时，是否允许外部交互关闭抽屉。
  - name: closeOnScrollOutside
    type: boolean
    default: 'false'
    description: dismissible 和 closeOnOutside 均为 true 时，在遮罩上滚轮或触摸滑动会关闭抽屉。抽屉内部滚动不会关闭。
  - name: portalTo
    type: 'string | HTMLElement'
    description: Teleport 目标。默认使用最近的 ui 类祖先；找不到时客户端内联渲染。
  - name: side
    type: "'left' | 'right' | 'bottom'"
    default: right
    description: 固定的物理边缘；left/right 不会按 RTL 翻转。
  - name: handleOffset
    type: string
    default: 24px
    description: 左右抽屉拉手的 CSS top 偏移量，或底部抽屉拉手的 left 偏移量。
slots:
  - name: handle
    description: 常驻切换按钮的视觉内容，接收 open。不要嵌套另一个 button。showTrigger 为 true 时优先于 trigger。
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

`side` 将面板固定在物理左、右或底部边缘；left/right 不会自动按 RTL 翻转。左右面板宽度为 `min(26rem, calc(100vw - 24px))`，高度为 `100dvh`。底部面板占满视口宽度，高度由内容决定，最大为 `calc(100dvh - 24px)`。面板从 `side` 指定的边缘滑入，关闭时滑出后再卸载。动画使用 `--ui-dur` 和 `--ui-ease`，在 `prefers-reduced-motion: reduce` 下停用。抽屉不添加滑动或拖动手势、高度动画或页面目录行为。

作为覆盖式侧栏使用时，设置 `side="left"`，并通过 `style` 指定面板宽度，例如 `width: min(16rem, calc(100vw - 24px))`。CSS 定位也可通过 `style` 传入。遮罩仍然覆盖整个视口。开启 `closeOnScrollOutside` 后，在遮罩上滚轮或触摸滑动就会关闭抽屉，抽屉内部滚动则保持打开。该选项要求 `dismissible` 与 `closeOnOutside` 均为 true，默认关闭。

提供 `handle` 插槽后启用常驻拉手。Drawer 渲染原生切换按钮，并设置 `aria-expanded`、`aria-controls`，以及来自 `triggerLabel`/`title` 或 `closeLabel` 的无障碍名称。插槽只负责视觉内容，接收 `{ open }`。按钮和面板共用一个平移容器，一起移动，不分别计算位移动画。拉手位于面板朝向正文一侧的外沿，可用 `handleOffset` 调整沿边位置。左右抽屉在拉手模式下默认宽度为 `min(26rem, calc(100vw - 48px))`，为拉手留出空间。覆盖宽度时也要预留拉手空间，尤其是使用文字拉手时。

展开时拉手属于模态焦点范围。关闭的面板内容为 inert，并对辅助技术隐藏。退出动画结束后卸载正文和页脚插槽，保留容器和拉手。关闭状态下，在拉手上按 Tab 可以继续移动到页面。`disabled` 阻止用拉手打开，`dismissible="false"` 禁止用拉手关闭。`showTrigger="false"` 会停用拉手模式，使用普通的外部受控抽屉。同时提供 `handle` 和 `trigger` 时，`handle` 优先。关闭后焦点回到拉手。由于焦点范围常驻，拉手模式不会在每次关闭时触发 `closeAutoFocus`。需要自定义 `returnFocus` 或关闭焦点流程时，使用普通 trigger 模式。

未声明的属性（包括 `class`、`style` 和焦点事件监听器）会透传到对话框内容，在拉手模式下即移动容器。默认 portal 目标是最近的消费端 `.ui` 祖先；找不到时客户端内联渲染。SSR 时仅在 `showTrigger` 为 true 且没有 handle 插槽时渲染普通内置触发器。拉手模式的按钮在客户端 portal 中渲染。SSR 不渲染 portal 内容。自定义 `portalTo` 目标必须存在，并由消费端提供主题和 UI token。根节点不会自行添加 `.ui`。关闭后正文内容会卸载，需要保留的状态应由消费端保存。

## 跟随面板的拉手

```vue
<Drawer
  v-model="open"
  title="章节导航"
  trigger-label="打开导航"
  close-label="关闭导航"
  side="left"
  handle-offset="24px"
  close-on-scroll-outside
  style="width: min(16rem, calc(100vw - 48px))"
>
  <template #handle="{ open: expanded }">
    <span aria-hidden="true">{{ expanded ? '‹' : '›' }}</span>
  </template>
  <nav>由调用方提供导航链接。</nav>
</Drawer>
```

## 用法

```vue
<script setup lang="ts">
import { Drawer } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/tokens.css'

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
