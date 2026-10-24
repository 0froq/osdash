---
title: NumberInput
designStatus: ai-draft
description: 可选数值模型的带标签原生数字输入框。
model:
  type: number | undefined
  description: 有限数值；输入为空或无法解析为有限数值时为 undefined。
props:
  - name: label
    type: string
    required: true
    description: 输入框上可见的文字标签。
  - name: min
    type: number
    description: 原生最小值约束。
  - name: max
    type: number
    description: 原生最大值约束。
  - name: step
    type: "number | 'any'"
    default: browser default (1)
    description: 原生步长约束；浏览器默认值为 1。
---

NumberInput 渲染带标签的原生 `type="number"` 控件。除非调用方提供初始值，否则模型没有初始值；输入为空或解析结果不是有限数值时，模型会更新为 `undefined`。父组件传入的有限数值会原样显示，不会按 `min` 或 `max` 截断。这些属性设置的是浏览器原生约束，不是应用层校验。组件不提供货币精度或电话号码语义。

未声明的原生属性和监听器会应用到 input；`class` 和 `style` 会应用到外层 label。输入框的 `type` 和 `value` 由组件控制，不要另传 `value`。`@input` 监听器收到原生 `Event`。重置原生表单不会同步重置 Vue 模型，消费端还需重置自己的状态。

## 用法

```vue
<script setup lang="ts">
import { NumberInput } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const quantity = ref<number | undefined>()
</script>

<template>
  <div class="ui">
    <NumberInput
      v-model="quantity"
      label="数量"
      :min="0"
      :max="20"
      :step="1"
      name="quantity"
      @input="(event: Event) => console.info(event)"
    />
  </div>
</template>
```
