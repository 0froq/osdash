---
title: ScrollSelect
designStatus: ai-draft
description: 面向短列表的紧凑单选器，用滚轮或方向键逐条切换。
model:
  type: string
  required: true
  description: 当前选项的值。必须等于某个选项的 value，否则显示第一个选项。
props:
  - name: label
    type: string
    required: true
    description: 控件上显示的文字标签，同时作为无障碍名称。
  - name: options
    type: ChoiceOption[]
    required: true
    description: 包含字符串 value、label 和可选 disabled 的选项数组。
  - name: hideLabel
    type: boolean
    default: 'false'
    description: 隐藏可见标签，仍保留无障碍名称。
  - name: disabled
    type: boolean
    description: 禁用控件。
  - name: name
    type: string
    description: 表单字段名。渲染一个隐藏 input，随表单提交当前值。
  - name: pending
    type: boolean
    default: 'false'
    description: 在调用方应用上一次变更期间（如路由切换）暂留滚动结果。pending 结束时窗口回到 model 对应的行。
  - name: wheel
    type: hover | focus | off
    default: focus
    description: 滚轮何时生效。`focus` 要求焦点在控件内，`hover` 指针悬停在控件上时也生效并阻止页面滚动，`off` 关闭滚轮切换。
slots:
  - name: option
    description: 接收 `{ option }`，同时作用于收起窗口的行、展开列表和隐藏的尺寸参考。`option.label` 保持纯文本。
---

ScrollSelect 是约七个选项以内的短列表紧凑选择器。常态显示当前词，以及上下相邻行各露出的半行，边缘渐隐。点击或按 Enter 展开列表，上边缘不动，向下增长。model 是必填字符串，必须等于某个选项的 value。长列表请用 Select 或 Combobox；ScrollSelect 没有打字搜索，也没有触摸滑动切换。

## 用法

```vue
<script setup lang="ts">
import { ScrollSelect } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/tokens.css'

const options = [
  { value: 'quiet', label: '安静' },
  { value: 'plain', label: '普通' },
  { value: 'loud', label: '响亮' },
]
const tone = ref('plain')
</script>

<template>
  <div class="ui">
    <ScrollSelect
      v-model="tone"
      label="风格"
      :options="options"
    />
  </div>
</template>
```

## 呈现

相邻行以半行高度透出，上下边缘渐隐，以此表明它是个选择器。文字在收起和展开时都紧贴起始边，打开列表不会有横向位移。当前选项用 `--ui-fg`，其他选项用 `--ui-muted`。列表展开时，它的行有一条贯穿整行宽度的 `--ui-fg` 6% 底色（和 Sidebar 相同），左缘一条和 Sidebar 相同的 accent 胶囊竖线，所以选中态不只靠颜色区分。悬停或聚焦的选项有下划线，1px，偏移 4px，和其他列表一致。

在这个字号下，`--ui-accent` 和 `--ui-bg` 的对比度较低。不要靠 accent 区分选项。

## 交互

在触发按钮上滚轮或按 ArrowUp/ArrowDown 时，一个手势只移动一个选项，不管滚了多远、多快或多久，model 立即更新。手势只在停顿、反向或新的一次滑动时结束，没有别的结束方式，所以一次长滚动不会变成多步。要再移动，请停一下、反向，或再滑一次。`pending` 为 true 期间滚轮不起作用，这个手势剩下的部分在 `pending` 结束后也不会被补上。`wheel` 控制滚轮何时生效：`focus` 要求焦点在控件内，`hover` 指针悬停时也生效并阻止页面滚动，`off` 关闭滚轮。禁用的选项会被滚轮和方向键跳过，也不能被点选。触摸时点击展开列表；控件上 `touch-action: none`，滑动不会滚动页面。减少动态效果设置会关闭过渡动画。

`pending` 在用户切换后把收起的窗口留在目标行，直到调用方应用完这次变更（如路由切换）。`pending` 结束时窗口回到 model 对应的行。

传入 `name` 可随表单提交当前值，组件会渲染一个隐藏 input，控件禁用时它一并禁用。列表保持短小，长列表或可搜索列表请用 Select 或 Combobox。
