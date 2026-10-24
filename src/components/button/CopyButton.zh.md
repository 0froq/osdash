---
title: CopyButton
designStatus: ai-draft
description: 复制文本并反馈剪贴板状态的按钮。
props:
  - name: text
    type: string
    required: true
    description: 点击时写入剪贴板的文本。
  - name: label
    type: string
    required: true
    description: 空闲状态显示的无障碍名称。
  - name: copiedLabel
    type: string
    required: true
    description: 复制成功后显示的无障碍名称。
  - name: errorLabel
    type: string
    required: true
    description: 复制失败时显示的无障碍名称。
  - name: pendingLabel
    type: string
    default: label
    description: 复制中显示的无障碍名称，默认使用 label。
  - name: resetAfter
    type: number
    default: "1600"
    description: 复制成功或失败后回到空闲状态前的毫秒数。小于等于零或非有限值时，结果会保留到下一次点击。
  - name: disabled
    type: boolean
    default: "false"
    description: 禁用复制。复制请求处理中按钮也会禁用。
events:
  - name: copy
    payload: string
    description: 复制成功时触发，参数是点击时成功写入剪贴板的原文。
  - name: error
    payload: Error
    description: 写入剪贴板失败时触发。
---

CopyButton 在用户点击后复制 `text` 属性，并在同一个网格单元中展示空闲、处理中、成功和失败文案。单元宽度由最长文案决定，不使用 JavaScript 测量文字。请求处理中按钮会禁用，避免并发复制。不支持剪贴板 API 或权限失败时会进入失败状态并触发 `error`，不会被视为复制成功。

重置时长在写入结束时读取；修改 `resetAfter` 不会重新计时当前结果。正的有限时长通过分段计时避免原生 timer 溢出；后台页面受浏览器节流时，实际回调可能更晚。开始下一次复制或销毁作用域会取消待执行的重置。

组件使用原生 button，未声明的属性会透传到该按钮。它的 `type` 固定为 `button`；`aria-label` 和 `aria-busy` 由当前状态控制。组件没有插槽，也不会自行添加 `.ui` 作用域类。调用方需引入 `style.css`，并将组件放在带有 `class="ui"` 的外层元素中。

写入剪贴板必须由用户手势直接触发，且只能在 HTTPS 或 localhost 等安全上下文中使用。详见 [MDN：Clipboard.writeText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText)。

## 用法

```vue
<script setup lang="ts">
import { CopyButton } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <CopyButton
      text="pnpm dev"
      label="复制命令"
      pending-label="正在复制命令"
      copied-label="命令已复制"
      error-label="无法复制"
      :reset-after="1600"
      :disabled="false"
      @copy="text => console.info('已复制：', text)"
      @error="error => console.error(error)"
    />
  </div>
</template>
```

不使用该组件时，可从 `@froq/ui/vue` 导入 `useClipboard(text, resetAfter?)`，它返回 `{ status, error, copy }`。在用户手势中直接调用 `copy()`；结果为 `{ ok: true, text }` 或 `{ ok: false, error }`。已有请求正在处理或作用域已销毁时返回 `undefined`。此 composable 需在 Vue setup/effect 作用域中使用。
