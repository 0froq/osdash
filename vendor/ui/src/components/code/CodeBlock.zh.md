---
title: CodeBlock
designStatus: stable
description: 带标题和可选角落操作的带边框源码框。
props:
  - name: label
    type: string
    description: 可见标题，通常是文件名。空白标题不画标题行。
  - name: code
    type: string
    description: 纯文本源码。未提供 spans 和默认插槽时渲染它。
  - name: spans
    type: CodeSpan[]
    description: 分段源码。一段可以自带颜色。设置了默认插槽时忽略。
  - name: collapsible
    type: boolean
    default: 'false'
    description: 把源码折进标题后面。没有标题的框不能折叠。默认收起。
  - name: copyLabel
    type: string
    description: 复制按钮的空闲文案。设置后渲染内置复制操作，复制 `code`。
  - name: copiedLabel
    type: string
    default: "'Copied'"
    description: 复制成功后显示的文案。
  - name: copyErrorLabel
    type: string
    default: "'Copy failed'"
    description: 复制失败后显示的文案。
  - name: pendingLabel
    type: string
    description: 剪贴板写入中的文案。默认用 `copyLabel`。
  - name: resetAfter
    type: number
    default: '1600'
    description: 复制文案恢复空闲前的毫秒数。
model:
  name: open
  type: boolean
  default: 'false'
  description: 可折叠框是否展开。collapsible 为 false 时忽略。
events:
  - name: copy
    description: 内置复制成功后触发，携带复制的文本。
  - name: copyError
    description: 内置复制失败后触发，携带错误。
slots:
  - name: action
    description: 可选的操作，例如链接。有标题时放在标题行、内置复制旁边；没有标题时浮在源码右上角。不提供则角落留给复制操作或留空。
  - name: default
    description: 替换源码区域。用于组件不负责的高亮源码，或不是源码列表的内容。
---

CodeBlock 是源码列表外面的框：一块表面、一个可选的标题、一个角落。设置 `copyLabel` 后它自带复制操作，把 `code` 写进剪贴板；角落要去别处时在 `action` 插槽放链接，否则留空。

`code` 输出纯文本。`spans` 把同一段文本拆开输出，每一段可以设置 `color`，颜色由调用方的色板决定。默认插槽会整个替换这块列表。语法检查、终端输出和翻译留在调用方。

加上 `collapsible` 后，源码可以折叠。框一开始是收起的，只留下标题和角落。点标题展开或收起，点角落不会展开。用 `v-model:open` 控制这个状态。没有标题的框不能折叠，否则收起后没有名字。收起时上下边距收短，读起来是一行，标题下的分隔线也隐去。展开后边距回到框的常规尺寸，分隔线渐现，源码在分隔线下 14px。展开时标题不会移动。展开后，只要这个框还在屏幕里，标题就钉在屏幕顶部，源码从它下面滑过并渐隐；祖先元素不能用 `overflow: hidden`、`auto` 或 `scroll` 裁剪，宿主页面顶部有固定栏时，覆盖 `.ui-code-block-header` 的 `top`。高度和边距一起动。系统要求减少动态效果时，过渡取消。

带标题的框，不论能否折叠，标题下都有一条分隔线。没有标题时没有标题行：操作浮在源码右上角，所以第一行较长时可能被它盖住。

引入 `@froq/ui/tokens.css`，并放在 `.ui` 里面。这块框要显示页面以外的色板时，在组件上覆盖 `--ui-bg`、`--ui-fg`、`--ui-muted`、`--ui-line` 和 `--ui-accent`。

## 用法

```vue
<script setup lang="ts">
import { CodeBlock } from '@froq/ui'
import '@froq/ui/tokens.css'

const source = 'print("hello")'
</script>

<template>
  <div class="ui">
    <CodeBlock
      label="hello.lua"
      :code="source"
      copy-label="复制"
      copied-label="已复制"
      copy-error-label="复制失败"
    />
  </div>
</template>
```
