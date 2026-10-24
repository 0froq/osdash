---
title: ToastRegion
designStatus: ai-draft
description: 为一个或多个 Toast 提供共享通知区域和 viewport。
props:
  - name: label
    type: string
    required: true
    description: 通知提供器的非空本地化名称。
  - name: viewportLabel
    type: string
    required: true
    description: viewport 地标的非空无障碍名称；支持替换 {hotkey}。
  - name: duration
    type: number
    default: "5000"
    description: Toast 默认自动关闭时长，单位毫秒；单个 Toast 的 duration 可覆盖。
  - name: hotkey
    type: string[]
    default: "['F8']"
    description: 将焦点移到 viewport 的快捷键。传入空数组可禁用快捷键。
  - name: position
    type: "'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'"
    default: bottom-end
    description: 通知 viewport 的逻辑位置。
  - name: portalTo
    type: string | HTMLElement
    description: Teleport 目标。默认使用最近的消费者 class 为 ui 的元素；找不到时以内联方式渲染。
slots:
  - name: default
    description: 一个或多个 Toast 实例。
---

ToastRegion 必须作为所有 Toast 的共同祖先。`label` 和 `viewportLabel` 都必须提供非空文字：前者用于通知提供器，后者命名 viewport 地标。`viewportLabel` 中的 `{hotkey}` 会替换为快捷键文字。`hotkey` 默认是 `['F8']`；传入 `[]` 可关闭快捷键。按下快捷键会聚焦 viewport。

一个区域可以容纳多个 Toast，并共享默认持续时间以及指针、焦点和窗口失焦时的暂停状态。`duration` 默认 5000ms，单条 Toast 可覆盖。区域本身不管理消息队列、唯一 ID、异步操作结果或全局 store；调用方负责所有通知状态和生命周期。滑动关闭在区域内禁用，区域本身不添加动画。

Region 的默认插槽仍包含普通子内容，并参与 SSR 渲染；ToastViewport 和 Toast 的通知内容通过 Portal 在客户端显示。未声明属性会转发给 ToastViewport。默认 portal 目标是最近的消费者 `class="ui"` 祖先；自定义目标必须由消费者提供主题和 UI token。找不到目标时以内联方式渲染。根节点不会自行添加 `.ui` 类。

`position` 使用逻辑方向，默认 `bottom-end`。未声明属性会转发给 viewport，不会应用到外层 scope 或单条 Toast。

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
      position="bottom-end"
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
