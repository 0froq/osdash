---
title: ToggleButton
designStatus: stable
description: 保持开/关按下状态的按钮。
props:
  - name: type
    type: "'button' | 'submit' | 'reset'"
    default: button
    description: 原生按钮类型。
  - name: disabled
    type: boolean
    default: 'false'
    description: 禁用状态。
  - name: label
    type: string
    description: 无障碍名称。默认插槽有文字时可省略。
model:
  name: default
  type: boolean
  default: 'false'
  description: 按钮是否处于按下状态。激活时翻转，并同步 `aria-pressed`。
slots:
  - name: default
    description: 两种状态都显示的内容。
  - name: off
    description: 仅在未按下时显示的内容，与 `on` 配对。
  - name: on
    description: 仅在按下时显示的内容，与 `off` 配对。
---

ToggleButton 表达的是状态，不是动作。激活时翻转由调用方通过 `v-model` 持有的布尔值，并用 `aria-pressed` 对外声明。边框沿用 `Button` 的虚线→实线语言；按下时表面填充一层淡 accent 色。提供 `off` 和 `on` 插槽可以在两个状态间切换文字（两者共用一个网格位，按钮宽度保持稳定），或者只用一个默认插槽放不变的文字。

一次性动作用 `Button`；这个状态的纯图标版用 `ToggleIconButton`；一组相关选项用 `ToggleGroup`。

## 用法

```vue
<script setup lang="ts">
import { ToggleButton } from '@froq/ui'
import { ref } from 'vue'

const bold = ref(false)
</script>

<template>
  <div class="ui">
    <ToggleButton v-model="bold">
      <strong>B</strong>
    </ToggleButton>
    <ToggleButton v-model="bold">
      <template #off> 提醒关闭 </template>
      <template #on> 提醒开启 </template>
    </ToggleButton>
  </div>
</template>
```
