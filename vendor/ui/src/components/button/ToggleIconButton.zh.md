---
title: ToggleIconButton
designStatus: stable
description: 纯图标的按下状态按钮，按状态切换图案。
props:
  - name: label
    type: string
    required: true
    description: 无障碍名称。内容只有图标，必填。
  - name: type
    type: "'button' | 'submit' | 'reset'"
    default: button
    description: 原生按钮类型。
  - name: frame
    type: boolean
    default: 'true'
    description: 画虚线边框。图标本身能自明可点时可关掉。
  - name: disabled
    type: boolean
    default: 'false'
    description: 禁用状态。
model:
  name: default
  type: boolean
  default: 'false'
  description: 按钮是否处于按下状态。激活时翻转，并同步 `aria-pressed`。
slots:
  - name: icon
    description: 关态图标，通常是 outline 或 linear 版本。
  - name: iconOn
    description: 开态图标，通常是实心版本。缺省回退到 `icon`。
---

ToggleIconButton 是 `ToggleButton` 的纯图标版：保持的状态，不是一次性动作。`label` 必填作为无障碍名称。`frame` 控制虚线边框——图标本身能自明可点时可以关掉。按下时带框按钮填充一层淡 accent 色；裸按钮只把图标调成 accent。

给同一个图形传不同形态——`icon` 用 outline、`iconOn` 用实心——状态变化就会表现为图标"填满"而不是布局跳动。文字版用 `ToggleButton`；一次性图标动作用 `IconButton`。

## 用法

```vue
<script setup lang="ts">
import { ToggleIconButton } from '@froq/ui'
import { ref } from 'vue'

const starred = ref(false)
</script>

<template>
  <div class="ui">
    <ToggleIconButton
      v-model="starred"
      label="收藏"
    >
      <template #icon>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8L12 3Z" />
        </svg>
      </template>
      <template #iconOn>
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8L12 3Z" />
        </svg>
      </template>
    </ToggleIconButton>
  </div>
</template>
```
