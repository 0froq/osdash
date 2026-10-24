---
title: Dialog
designStatus: ai-draft
description: 受控开关并可配置关闭方式的模态对话框。
model:
  type: boolean
  default: "false"
  description: 对话框是否打开。
props:
  - name: title
    type: string
    required: true
    description: 可见的对话框标题。
  - name: closeLabel
    type: string
    required: true
    description: 内置关闭按钮的无障碍名称。
  - name: description
    type: string
    description: 可选的可见描述，并关联到对话框。
  - name: triggerLabel
    type: string
    default: title
    description: 未提供 trigger 插槽时显示的触发按钮文字，默认使用 title。
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
    description: 禁用触发按钮；父组件仍可通过模型打开对话框。
  - name: dismissible
    type: boolean
    default: "true"
    description: 是否显示内置关闭按钮并允许 Escape 或点击外部关闭。
  - name: closeOnOutside
    type: boolean
    default: "true"
    description: dismissible 为 true 时，是否允许外部交互关闭对话框。
  - name: portalTo
    type: "string | HTMLElement"
    description: Teleport 目标。默认使用最近的 ui 类祖先；找不到时客户端内联渲染。
slots:
  - name: trigger
    description: 可选的单个 button 子节点；使用原生 button 或会透传属性及 button ref 的组件。
  - name: default
    description: 对话框主体，接收 close()；关闭时会卸载。
  - name: footer
    description: 可选页脚内容，接收 close()。
events:
  - name: openAutoFocus
    payload: Event
    description: 对话框打开、默认焦点移动前同步触发的可取消事件。
  - name: closeAutoFocus
    payload: Event
    description: 对话框关闭时同步触发的可取消事件；可用 preventDefault() 自行管理焦点。
---

Dialog 使用初始关闭的受控布尔 `v-model`，可用于由消费端控制多个入口的模态流程。焦点陷阱、层级和 Escape 处理由 Reka UI 提供。默认 `showTrigger="true"` 时，Reka 内置触发器提供默认焦点返回目标；`disabled` 只禁用这个内置触发器，外部控件需由消费端自行禁用。使用外部入口时设为 `showTrigger="false"`，此时内置触发器和 trigger 插槽都不渲染。该模式下，组件在层的 `openAutoFocus` 事件中、默认焦点移动前捕获非 `body` 的活动元素；它不会监听所有可能的打开动作。如果消费端在该事件前已自行移动焦点到内容中，必须显式传入 `returnFocus`。该值必须是可聚焦的 `HTMLElement`；组件不会为普通元素补 `tabindex`。

`showTrigger="false"` 时，焦点恢复优先使用有效的 `returnFocus`，其次尝试捕获到的打开前元素。目标必须仍连接在文档中、未禁用、未处于 hidden 或 inert 子树内，并具有布局；两者都无效时，组件不会猜测页面级后备焦点。显示内置触发器时，默认焦点返回由 Reka UI 处理。声明的 `openAutoFocus` 与 `closeAutoFocus` 事件会同步接收可取消的 DOM `Event`，需同步调用 `preventDefault()`。若外部候选焦点都不合适，可用 `@close-auto-focus.prevent` 接管焦点恢复。`dismissible` 控制内置关闭按钮以及 Escape/外部关闭。`dismissible="false"` 时 `closeOnOutside` 不起作用。dismissible 为 true 时，将 `closeOnOutside` 设为 false 会阻止外部关闭，但保留关闭按钮和 Escape。插槽的 `close()` 和父组件更新模型始终可以关闭对话框。

未声明的属性会绑定到 Reka 的 `DialogContent`，不会绑定到 trigger 或外层 scope。未提供 `description` 时，组件会从透传属性中移除 `aria-describedby`，避免引用不存在的描述。trigger 插槽必须使用单个原生 button，或确实能透传属性和 button ref 的组件；不要用 div 或链接伪装按钮。

默认情况下，对话框会 portal 到最近的消费端 `.ui` 祖先。找不到目标时，客户端会内联渲染。SSR 时仅在 `showTrigger` 为 true 时渲染内置触发器，portal 内容不会渲染。自定义 `portalTo` 目标必须存在，并提供消费端所需的设计 token 和主题。Dialog 根节点不会自行添加 `.ui`；作用域及 portal 目标的样式由消费端提供。

主体和页脚插槽都会收到 `close()`。Reka 默认会在对话框关闭时卸载内容；需要跨关闭保留的状态应由消费端保存。Dialog 不提供 alert-dialog 语义，也不实现异步确认或业务逻辑。

## 用法

```vue
<script setup lang="ts">
import { Dialog } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)
</script>

<template>
  <div class="ui">
    <Dialog
      v-model="open"
      title="文档详情"
      description="查看当前草稿。"
      close-label="关闭对话框"
      trigger-label="查看草稿"
    >
      <template #default="{ close }">
        <p>草稿详情由调用方提供。</p>
        <button
          type="button"
          @click="close"
        >
          取消
        </button>
      </template>
      <template #footer="{ close }">
        <button
          type="button"
          @click="close"
        >
          关闭
        </button>
      </template>
    </Dialog>
  </div>
</template>
```
