---
title: Toast
designStatus: ai-draft
description: 需要 ToastRegion 承载的临时通知。
model:
  type: boolean
  default: "false"
  description: 控制当前通知是否打开。
props:
  - name: title
    type: string
    required: true
    description: 通知标题。
  - name: closeLabel
    type: string
    required: true
    description: 关闭按钮的无障碍名称。
  - name: description
    type: string
    description: 可选的通知描述；提供默认插槽时由插槽内容替代。
  - name: duration
    type: number
    description: 自动关闭时长，单位毫秒；省略时使用 ToastRegion 的 duration。
  - name: type
    type: "'foreground' | 'background'"
    default: foreground
    description: foreground 使用 assertive 播报，background 使用 polite 播报。
  - name: action
    type: "{ label: string, altText: string }"
    description: 可选操作按钮及替代操作说明；请在持久界面中保留该操作的替代入口。
events:
  - name: action
    payload: MouseEvent
    description: 激活操作按钮时触发原始鼠标事件并关闭；关闭与事件的先后顺序不保证，异步返回值和 preventDefault 不能可靠取消关闭。
slots:
  - name: default
    description: 只替换描述内容的文本插槽。
---

Toast 必须放在祖先 `ToastRegion` 内。使用布尔 `v-model` 控制通知，默认关闭。可同时挂载多个 Toast；每条通知的 ID、队列、打开状态和异步操作结果都由调用方管理，组件不提供全局消息 store。

`title` 和 `closeLabel` 必填。可选的 `description` 显示描述文字；提供默认插槽时，插槽内容会替代该属性。`type="foreground"` 使用 assertive 动态播报，`background` 使用 polite。通知中的 action 是临时快捷入口。其 `{ label, altText }` 描述按钮和替代操作方式；调用方应在页面持久保留同一操作入口，确保不使用或错过 Toast 操作时仍能完成任务。

激活 action 时会发出 `action(MouseEvent)` 并关闭 Toast；关闭与事件处理器的先后顺序不保证。组件不会等待监听器返回的 Promise，`preventDefault()` 也不能可靠地取消关闭。异步请求、成功或错误通知以及重试由调用方管理。action 是临时快捷入口；相同操作还应在持久界面中保留替代路径。关闭当前 Toast 时，如果焦点位于该通知内，会把焦点移到 ToastRegion 的 viewport。Escape 只关闭当前获得焦点的 Toast。

`duration` 覆盖区域默认时长；省略时继承 ToastRegion，默认 5000ms。值为 0、负数或非有限数时不会自动关闭。计时器仅在客户端挂载后启动；Toast 重新打开或时长变化会重置计时，标题和描述变化不会重置。指针停留在 viewport、viewport 内有焦点或窗口失焦时会暂停计时，恢复后继续剩余时间。销毁组件会清理其计时器；SSR 阶段不会运行自动关闭计时。

ToastRegion 会共享暂停状态和展示 viewport。区域不实现队列、ID 管理或业务请求状态；调用方负责创建、关闭和清理通知。Toast 的未声明属性会转发到 toast 根元素。组件不支持滑动关闭，也没有进入/离场动画。

## 用法

```vue
<script setup lang="ts">
import { Toast, ToastRegion } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const messages = ref([
  {
    id: 'demo',
    open: true,
    title: '示例通知',
    description: '用于演示临时通知，不代表已完成业务操作。',
  },
])
</script>

<template>
  <div class="ui">
    <ToastRegion
      label="通知"
      viewport-label="通知区域，快捷键 {hotkey}"
    >
      <Toast
        v-for="message in messages"
        :key="message.id"
        v-model="message.open"
        :title="message.title"
        :description="message.description"
        close-label="关闭通知"
      />
    </ToastRegion>
  </div>
</template>
```
