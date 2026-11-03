---
title: IconButton
designStatus: stable
description: 纯图标的动作按钮，按状态切换图案。
props:
  - name: label
    type: string
    required: true
    description: 无障碍名称。内容只有图标，必填。
  - name: type
    type: "'button' | 'submit' | 'reset'"
    default: button
    description: 原生按钮类型。
  - name: action
    type: '() => unknown | Promise<unknown>'
    description: 点击执行的动作。成功显示成功态，失败显示失败态。
  - name: resetAfter
    type: number
    default: '900'
    description: 结果状态恢复空闲前的毫秒数。
  - name: frame
    type: boolean
    default: 'true'
    description: 画虚线边框。图标本身能自明可点时可关掉。
events:
  - name: click
    description: 激活时触发。
slots:
  - name: icon
    description: 常态图标，通常是 outline 或 linear 版本。
  - name: iconHover
    description: 悬停时显示。缺省回退到 `icon`。
  - name: iconActive
    description: 工作中或成功后显示。缺省回退到 `icon`。
  - name: iconError
    description: 失败后显示。缺省回退到 `icon`。
---

IconButton 和 `Button` 一样表示一个动作，但内容只有图标、`label` 必填作为无障碍名称。`frame` 控制虚线边框——图标本身就能自明可点时可以关掉让它裸着。给 `action` 一个函数能得到和 `Button` 相同的结果反馈：pending 时呼吸，成功后落为成功色，失败时按 danger 色抖动。

图标是一组插槽堆叠。默认显示 `icon`；`iconHover`、`iconActive`、`iconError` 分别在悬停、工作或成功、失败时切入，缺省时都回退到 `icon`。传同一个图形的不同形态（比如 `icon` 用 linear、`iconActive` 用 bold），状态变化就会表现为图标"填满"而不是布局跳动。

## 用法

```vue
<script setup lang="ts">
import { IconButton } from '@froq/ui'
import '@froq/ui/tokens.css'
</script>

<template>
  <div class="ui">
    <IconButton
      label="收藏"
      :action="save"
    >
      <template #icon>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M5 4h14v16l-7-4-7 4V4Z" />
        </svg>
      </template>
      <template #iconActive>
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M5 4h14v16l-7-4-7 4V4Z" />
        </svg>
      </template>
    </IconButton>
  </div>
</template>
```
