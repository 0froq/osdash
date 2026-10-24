---
title: Select
designStatus: ai-draft
description: 支持原生和自定义外观的单选下拉框。
model:
  type: string
  required: true
  description: 当前选项的值。
props:
  - name: native
    type: boolean
    default: "true"
    description: 使用原生 select；设为 false 使用紧凑的自定义下拉框。
  - name: hideLabel
    type: boolean
    default: "false"
    description: 隐藏可见标签，仍保留无障碍名称。
  - name: accent
    type: string
    description: 可选 CSS 颜色，在本控件内覆盖 --ui-accent。
  - name: align
    type: start | center | end
    default: start
    description: 自定义下拉框相对触发按钮的对齐方式。
  - name: disabled
    type: boolean
    description: 禁用控件，两种模式均支持。
  - name: required
    type: boolean
    description: 表单提交时要求有值。
  - name: name
    type: string
    description: 表单字段名，两种模式均支持。
  - name: framed
    type: boolean
    default: "false"
    description: Full outline and token background; inherits the host font.
  - name: label
    type: string
    required: true
    description: 下拉框上显示的文字标签。
  - name: options
    type: ChoiceOption[]
    required: true
    description: 包含字符串 value、label 和可选 disabled 的选项数组。
---

Select 默认保留原生模式，设为 `:native="false"` 使用自定义 combobox/listbox。选项格式为 `{ value, label, disabled? }`，通过 `v-model` 绑定字符串。两种模式都支持 `disabled`、`required`、`name`。其他属性和事件透传给原生 select 或自定义触发按钮；`class`、`style` 放在外层容器。仅支持单选，请用 `v-model`，不支持额外的 `value` 或 `multiple`。

## 用法

```vue
<script setup lang="ts">
import { Select } from '@froq/ui'
import { ref } from 'vue'

const options = [
  { value: 'quiet', label: '安静' },
  { value: 'plain', label: '普通' },
]
const tone = ref('plain')
</script>

<template>
  <div class="ui">
    <Select
      v-model="tone"
      label="风格"
      :options="options"
    />
  </div>
</template>
```

## 外观

原生选择框共用一个距右侧 12 px 的箭头，右侧 34 px padding 为箭头留位。箭头忽略指针事件，鼠标、键盘、触摸和辅助技术交互仍由原生 select 处理。可选 `framed`（boolean，默认 false）显示完整边框和 token 背景，并继承宿主字体；默认样式保留下划线。两种外观只读取现有 UI token。

自定义模式的触发按钮默认无边框，`framed` 可加边框。下拉框为直角细边框、无阴影、无行间隙的紧凑列表。hover 使用淡 accent 背景；选中项使用 accent 实底和 `--ui-bg` 文字。选中和禁用是独立状态。方向键、文字搜索、Enter/Space、Esc 及点击外部关闭由 Reka UI 处理。下拉内容即使通过 portal 渲染，也保留在控件的 token 作用域内。减少动态效果设置会禁用触发按钮的颜色过渡。

```vue
<Select
  v-model="tone"
  :native="false"
  :options="options"
  label="风格"
  hide-label
  accent="oklch(65% 0.16 145)"
/>
```

`accent` 直接写入 `--ui-accent`，接受浏览器支持的 HEX（含透明度）、命名颜色、`rgb()`、`hsl()`、`oklch()`、`color(display-p3 ...)` 和 `var(--brand-color)`。不做仅支持 HEX 的解析或 JavaScript 转换。不传时继承调用方的 accent。应选择与 `--ui-bg` 有足够对比度的颜色；组件不自动校正对比度或透明度。

自定义模式提供 `option` 插槽，参数为 `{ option }`，可为选项文字补充 `lang` 等属性。`option.label` 保持纯文本，用于键盘搜索和当前值。标准样式无需触发按钮插槽。
