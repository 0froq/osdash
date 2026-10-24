---
title: Slider
designStatus: ai-draft
description: 带可见标签的原生单滑块范围输入。
model:
  type: number
  default: "50"
  description: 受控滑块值；显示值会限制在规范化后的上下界内。
props:
  - name: label
    type: string
    required: true
    description: 范围输入的可见文本标签。
  - name: min
    type: number
    default: "0"
    description: 最小值。非有限数值会回退为 0。
  - name: max
    type: number
    default: "100"
    description: 最大值。非有限数值回退为 max(min, 100)；有限且小于 min 的值会规范化为 min。
  - name: step
    type: number | 'any'
    default: "1"
    description: 原生范围输入步长。非有限或非正数值回退为 1；any 表示不限制步进粒度。
---

Slider 使用原生 `<input type="range">`，包含一个滑块，不提供双滑块范围。通过 `v-model` 绑定数值，默认值为 50。有限的显示值会限制在规范化后的上下界内；model 为非有限数值时显示区间中点。步长对齐由浏览器原生控件处理。组件不会在渲染时改写外部传入的越界或非步长 model 值；用户操作输入框时才会通过 `valueAsNumber` 更新 model。

`min` 默认 0，非有限数值回退为 0。`max` 默认 100；非有限数值回退为规范化后的 `min` 与 100 中较大的值，有限且小于 `min` 时则规范化为 `min`。`step` 默认 1；非有限或非正数值回退为 1。设置 `step="any"` 可使用原生的任意步进值。

`class` 和 `style` 会应用到外层 label。其他未声明的原生属性，包括 `name`、`disabled` 和 `aria-valuetext`，会转发给 input。原生 range 输入不支持 `readonly`。重置外层表单不会自动重置 Vue model。

组件没有插槽。样式只使用 UI 库 token，不依赖字体、路由或业务状态。在调用方引入 `style.css`，并将组件放在带有 `class="ui"` 的元素内。

## 用法

```vue
<script setup lang="ts">
import { Slider } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const volume = ref(50)
</script>

<template>
  <div class="ui">
    <Slider
      v-model="volume"
      label="音量"
      :min="0"
      :max="100"
      :step="5"
      :aria-valuetext="`${volume}%`"
    />
  </div>
</template>
```
