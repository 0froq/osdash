---
title: CodeBlock
designStatus: ai-draft
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
    default: "false"
    description: 把源码折进标题后面。没有标题的框不能折叠。默认收起。
model:
  name: open
  type: boolean
  default: "false"
  description: 可折叠框是否展开。collapsible 为 false 时忽略。
slots:
  - name: action
    description: 可选的操作，例如复制按钮或链接。有标题时放在标题行；没有标题时浮在源码右上角。不提供则角落留空。
  - name: default
    description: 替换源码区域。用于组件不负责的高亮源码，或不是源码列表的内容。
---

CodeBlock 是源码列表外面的框：一块表面、一个可选的标题、一个角落。它不负责复制、路由或高亮。需要复制时把 `CopyButton` 放进 `action` 插槽，角落要去别处时放链接，角落留空时什么都不放。

`code` 输出纯文本。`spans` 把同一段文本拆开输出，每一段可以设置 `color`，颜色由调用方的色板决定。默认插槽会整个替换这块列表。语法检查、终端输出和翻译留在调用方。

加上 `collapsible` 后，源码可以折叠。框一开始是收起的，只留下标题和角落。点标题展开或收起，点角落不会展开。用 `v-model:open` 控制这个状态。没有标题的框不能折叠，否则收起后没有名字。收起时上下边距收短，读起来是一行，标题下的分隔线也隐去。展开后边距回到框的常规尺寸，分隔线渐现，源码在分隔线下 14px。展开时标题不会移动。展开后，只要这个框还在屏幕里，标题就钉在屏幕顶部，源码从它下面滑过并渐隐；祖先元素不能用 `overflow: hidden`、`auto` 或 `scroll` 裁剪，宿主页面顶部有固定栏时，覆盖 `.ui-code-block-header` 的 `top`。高度和边距一起动。系统要求减少动态效果时，过渡取消。

带标题的框，不论能否折叠，标题下都有一条分隔线。没有标题时没有标题行：操作浮在源码右上角，所以第一行较长时可能被它盖住。

引入 `@froq/ui/style.css`，并放在 `.ui` 里面。这块框要显示页面以外的色板时，在组件上覆盖 `--ui-bg`、`--ui-fg`、`--ui-muted`、`--ui-line` 和 `--ui-accent`。

## 用法

```vue
<script setup lang="ts">
import { CodeBlock, CopyButton } from '@froq/ui'
import '@froq/ui/style.css'

const source = 'print("hello")'
</script>

<template>
  <div class="ui">
    <CodeBlock
      label="hello.lua"
      :code="source"
    >
      <template #action>
        <CopyButton
          :text="source"
          label="复制"
          copied-label="已复制"
          error-label="复制失败"
        />
      </template>
    </CodeBlock>
  </div>
</template>
```
