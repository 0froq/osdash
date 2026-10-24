---
title: Banner
designStatus: ai-draft
description: 用于活动、公告或 WIP 提示的站点级通知条。
props:
  - name: label
    type: string
    required: true
    description: 通知区域的无障碍名称。
  - name: dismissLabel
    type: string
    description: 可选关闭按钮的无障碍名称。不传则持续显示。
events:
  - name: dismiss
    payload: void
    description: 请求关闭；组件不会自行隐藏或移动焦点。
slots:
  - name: default
    description: 使用方提供的通知内容。
  - name: actions
    description: 可选链接或按钮，可放项目的路由链接。
---

Banner 是放在网站页头或内容上方的通栏通知，不是局部的 Alert。它留在正常文档流里，占住自己的高度，并贴在滚动区域的顶部。长文案自然换行。不含计时器、存储、路由或 `v-model`。

必填的 `label` 为通知区域命名。它不使用属于网站页头的 `banner` 地标，也不自动作为 live region 播报；静态提示持续可见，不在切换页面时反复打断辅助技术。

传入 `dismissLabel` 才显示关闭按钮，点击只发出 `dismiss`。显示状态、持久化和移除后的焦点由使用方管理。必需信息不要只放在可关闭的提示里。`actions` 插槽接受真正的链接或按钮，不把整个通知条变成点击区域。

使用方引入 `@froq/ui/style.css`，外层加 `.ui`。文案、链接、翻译和活动策略留在项目里。

## 用法

```vue
<script setup lang="ts">
import { Banner } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <Banner label="站点提示">
      此网站仍在建设中。
      <template #actions>
        <a href="/changelog">查看更新</a>
      </template>
    </Banner>
  </div>
</template>
```
