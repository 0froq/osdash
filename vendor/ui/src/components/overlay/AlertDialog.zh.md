---
title: AlertDialog
designStatus: ai-draft
description: 提供明确确认和取消操作的模态确认对话框。
model:
  type: boolean
  default: "false"
  description: 对话框是否打开，支持 v-model。
props:
  - name: title
    type: string
    required: true
    description: 可见的对话框标题。
  - name: description
    type: string
    required: true
    description: 可见的对话框说明。
  - name: cancelLabel
    type: string
    required: true
    description: 取消按钮的可见文案。
  - name: confirmLabel
    type: string
    required: true
    description: 确认按钮的可见文案。
  - name: triggerLabel
    type: string
    description: 未提供 trigger 插槽时的触发按钮文案，默认使用 title。
  - name: disabled
    type: boolean
    default: "false"
    description: 只禁用触发按钮。父组件仍可通过模型打开对话框。
  - name: pending
    type: boolean
    default: "false"
    description: 禁用确认操作并在内容上设置 aria-busy；取消和 Escape 仍可用。
  - name: confirmDisabled
    type: boolean
    default: "false"
    description: 独立于 pending 禁用确认按钮。
  - name: portalTo
    type: string | HTMLElement
    description: Teleport 目标。默认使用最近的消费者 class 为 ui 的元素；找不到时以内联方式渲染。
events:
  - name: confirm
    payload: MouseEvent
    description: 允许确认时同步触发并传入原始鼠标事件。在事件处理器返回前阻止默认行为可保持对话框打开。
slots:
  - name: trigger
    description: 可选的单个 button 子节点，或会转发触发器属性和事件的按钮组件。
  - name: default
    description: 可选的对话框主体内容。页脚固定，不提供对应插槽。
---

AlertDialog 是模态确认对话框，必须提供 `title`、`description`、`cancelLabel` 和 `confirmLabel`。布尔 `v-model` 默认值为 `false`。未提供 trigger 插槽时，`triggerLabel` 默认使用 `title`。可选的 trigger 插槽必须最终渲染为单个真实按钮；若使用按钮组件，它必须转发收到的属性和事件。`disabled` 只作用于该触发按钮，因此父组件仍可通过 `v-model` 打开对话框。

对话框内置取消按钮，没有关闭图标。Reka UI 会将初始焦点放在取消按钮上。取消按钮和 Escape 都会关闭对话框；外部交互会被阻止。关闭时对话框内容会卸载。可选默认插槽会在说明和固定页脚之间添加主体内容；没有自定义页脚插槽。

确认操作被激活且未被 `pending` 或 `confirmDisabled` 阻止时，组件会同步触发 `confirm` 并传入原始 `MouseEvent`。若事件处理器返回前没有阻止默认行为，对话框就会关闭。启动异步操作时使用 `@confirm.prevent`：Vue 会同步阻止事件，因此请求运行期间对话框保持打开。请求状态、成功、错误和取消都由调用方管理；组件不会等待 Promise，也不会宣称操作已成功。成功后由调用方将 `v-model` 设为 `false` 来关闭对话框。

`pending` 会在内容上设置 `aria-busy`，且只禁用确认按钮。取消和 Escape 仍可用，因此 pending 不会锁定请求或阻止取消。`confirmDisabled` 禁用确认操作，但不会将内容标为忙碌。

未声明属性会转发给内容，不会传给 trigger 或外层 scope。默认情况下，内容会 portal 到最近的消费者 `class="ui"` 元素；找不到时会在客户端以内联方式渲染。SSR 时会渲染 trigger，但不会渲染 portal 内容。自定义 `portalTo` 目标必须已经存在，并由消费者提供主题和 UI token。组件根节点不会添加 `.ui` 类。在调用方引入 `style.css`，并提供 `.ui` 祖先元素，以供库样式和默认 portal 目标使用。

## 用法

```vue
<script setup lang="ts">
import { AlertDialog, Button } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)
const confirmed = ref(false)

function confirm() {
  confirmed.value = true
}
</script>

<template>
  <div class="ui">
    <AlertDialog
      v-model="open"
      title="删除草稿？"
      description="此操作无法撤销。"
      cancel-label="取消"
      confirm-label="删除"
      @confirm="confirm"
    >
      <template #trigger>
        <Button>删除草稿</Button>
      </template>
      <p>确定删除当前草稿吗？</p>
    </AlertDialog>
    <p v-if="confirmed">
      此示例已确认删除意图，没有发送请求。
    </p>
  </div>
</template>
```
