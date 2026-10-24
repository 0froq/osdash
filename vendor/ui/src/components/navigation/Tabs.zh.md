---
title: Tabs
designStatus: ai-draft
description: 支持键盘操作、面板常驻的标签页组件。
model:
  type: string
  required: true
  description: 当前选中标签的 value。
props:
  - name: items
    type: ChoiceOption[]
    required: true
    description: 标签项，value 必须稳定且唯一，并含有 label 和可选 disabled 状态。
  - name: label
    type: string
    required: true
    description: 标签列表的无障碍名称。
  - name: orientation
    type: "'horizontal' | 'vertical'"
    default: horizontal
    description: 标签布局方向及对应的方向键。
  - name: activation
    type: "'automatic' | 'manual'"
    default: automatic
    description: 方向键移动焦点时是否同时选中，或等待显式激活。
slots:
  - name: label
    description: 接收 item 和 active 以替换标签文字；不要在此放交互内容。
  - name: default
    description: 每个常驻面板都接收 item 和 active。
---

Tabs 为每项渲染一个标签和一个面板。`items` 的 value 必须唯一且稳定。必需的 `v-model` 是字符串值。若模型值无效或对应禁用项，不会自动修正：第一个可用标签会成为 Tab 入口，但不会自动选中。若模型值对应禁用项，该项的面板仍可显示。所有面板始终保持挂载；非活动面板会隐藏并设为 inert。

方向键按 `orientation` 工作；水平布局在 RTL 中反转左右方向。Home 和 End 将焦点移到第一个或最后一个可用标签。`activation="automatic"` 时，方向键移动焦点也会选中标签；`manual` 时方向键只移动焦点，Enter 或 Space 使用原生 button 行为完成选择。带修饰键时不会拦截按键。label 插槽替换标签按钮内部的文字，只应放标签内容，不要嵌套交互控件。default 插槽会收到每个面板的 `item` 和 `active` 状态。

无样式的键盘与选择行为可从 `@froq/ui/vue` 使用 `useTabs`。

## 用法

```vue
<script setup lang="ts">
import { Tabs } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const active = ref('overview')
const items = [
  { value: 'overview', label: '概览' },
  { value: 'settings', label: '设置' },
]
</script>

<template>
  <div class="ui">
    <Tabs
      v-model="active"
      :items="items"
      label="账户栏目"
      orientation="horizontal"
      activation="automatic"
    >
      <template #label="{ item }">
        {{ item.label }}
      </template>
      <template #default="{ item, active: selected }">
        <h2>{{ item.label }}</h2>
        <p>{{ selected ? '当前面板已选中。' : '当前面板未激活。' }}</p>
      </template>
    </Tabs>
  </div>
</template>
```
