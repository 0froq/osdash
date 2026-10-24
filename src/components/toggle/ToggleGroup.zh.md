---
title: ToggleGroup
designStatus: ai-draft
description: 支持单选或多选的带标签切换按钮组。
model:
  type: string | string[]
  default: "''"
  description: 单选模式为字符串，多选模式为字符串数组。
props:
  - name: label
    type: string
    required: true
    description: 用于命名按钮组的可见标签。
  - name: options
    type: ChoiceOption[]
    required: true
    description: 含唯一非空 value、label 和可选禁用状态的选项。
  - name: type
    type: "'single' | 'multiple'"
    default: single
    description: 允许一个或多个选项处于激活状态。
  - name: orientation
    type: "'horizontal' | 'vertical'"
    default: horizontal
    description: 按方向键移动焦点时使用的组方向。
  - name: dir
    type: "'ltr' | 'rtl'"
    description: 阅读及键盘方向；默认使用 Reka UI 方向上下文，无上下文时为 ltr。
  - name: loop
    type: boolean
    default: "true"
    description: 方向键焦点移动是否在首尾启用循环。
  - name: disabled
    type: boolean
    default: "false"
    description: 禁用整个按钮组。
slots:
  - name: option
    description: 接收 option 和 active 以替换标签；不要加入交互后代。
---

ToggleGroup 渲染可见标签和由该标签命名的按钮组。单选模式下模型为字符串，空字符串表示没有激活项。多选模式下模型为字符串数组，空数组表示没有激活项。选项 value 必须唯一且非空，因为空字符串用于清除单选状态。

窄类型的 TypeScript 单选模型必须包含 `''`，例如 `ref<'' | 'left' | 'right'>('left')`。多选模型使用数组，空数组已经表示清除。选项值应与消费端模型类型兼容；泛型不会验证远端选项数据。

组件会将传入的模型形状转换为显示值，但不会重写父组件的值：多选模式会把字符串视为一个选中值；单选模式会把数组的首项作为选中值。未知值和禁用选项的值不会自动清理或修正。用户选择时才按当前 `type` 写回对应形状：单选为字符串或空字符串，多选为数组。

按钮组使用 `role="group"`，并以可见标签作为无障碍名称。每个选项都是带 `aria-pressed` 的按钮。禁用项和禁用整组时使用 Reka UI 的原生禁用行为。方向键依照 `orientation` 移动焦点，Home 和 End 分别移到第一个和最后一个可用项；`loop` 控制是否循环。水平布局的方向键行为遵循 RTL 方向。Space 和 Enter 切换当前焦点项。`option` 插槽只替换按钮标签，内容不能包含交互后代。这不是 tabs 控件，也不是提供原生 required-radio 校验的单选组；需要原生 radio 表单行为时请使用 `RadioGroup`。

`class` 和 `style` 会应用到外层字段包装元素。其他未声明属性会应用到 Reka 组根节点，不会应用到每个选项按钮。

## 用法

```vue
<script setup lang="ts">
import { ToggleGroup } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const alignment = ref('left')
const emphasis = ref<string[]>(['italic'])
const alignments = [
  { value: 'left', label: '左对齐' },
  { value: 'center', label: '居中' },
  { value: 'right', label: '右对齐' },
]
const emphasisOptions = [
  { value: 'italic', label: '斜体' },
  { value: 'underline', label: '下划线' },
  { value: 'strike', label: '删除线', disabled: true },
]
</script>

<template>
  <div class="ui">
    <ToggleGroup
      v-model="alignment"
      label="对齐方式"
      :options="alignments"
    />
    <ToggleGroup
      v-model="emphasis"
      type="multiple"
      label="强调样式"
      :options="emphasisOptions"
    />
  </div>
</template>
```
