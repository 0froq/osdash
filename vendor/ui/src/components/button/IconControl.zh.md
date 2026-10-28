---
title: IconControl
designStatus: ai-draft
description: 方形图标控件。默认渲染为按钮，给了 URL 时渲染为链接。
props:
  - name: label
    type: string
    required: true
    description: 无障碍名称，设置到 aria-label。不会作为可见文字渲染。
  - name: href
    type: string
    description: 渲染为 a 元素而非 button。绝对 URL 会在新标签页打开，并带 rel=noreferrer。
  - name: type
    type: "'button' | 'submit' | 'reset'"
    default: button
    description: 原生按钮类型。设置 href 时忽略。
  - name: bordered
    type: boolean
    default: "true"
    description: 绘制发丝边框。设为 false 得到无框图标，仅在悬停时出现边框。
  - name: accent
    type: boolean
    default: "false"
    description: 图标保持强调色，用于把该链接读作主操作。
slots:
  - name: default
    description: 装饰性图标内容，会放在 aria-hidden 容器内。
---

IconControl 是一个方形控件，要么是按钮，要么是链接。传 `href` 渲染为 `<a>`，不传渲染为 `<button>`。两种合用一个组件，是因为图标、边框、尺寸和悬停表现完全一致；拆成两个组件只是把选择挪到了 import 列表里。

`label` 始终是无障碍名称，不会显示出来。默认插槽只放图标图案，它位于 `aria-hidden` 容器内，不能放有语义的文字或任何交互子元素。未声明的原生属性和监听器会落到实际渲染的那个元素上。

绝对 `href` 会在新标签页打开，并带上 `rel="noreferrer"`。相对 `href` 保持原地跳转，站内链接因此是普通导航。切换按钮的 `aria-pressed` 由消费端传入；IconControl 不管理按下状态。

`bordered` 默认 true。无框控件保留 32px 点击区，但只在悬停时显示边框。`accent` 把图标染成强调色，悬停时边框也一起染，适合该链接是整行主操作的情况。

## 用法

```vue
<script setup lang="ts">
import { IconControl } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <IconControl
      label="收藏这张卡片"
      :aria-pressed="false"
      :bordered="false"
      @click="console.info('已收藏')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 3.6 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z" />
      </svg>
    </IconControl>

    <IconControl
      label="在 GitHub 打开"
      href="https://github.com/0froq/osdash"
      accent
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.88 2.34.67.07-.52.28-.88.51-1.08-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
    </IconControl>
  </div>
</template>
```
