---
title: DateInput
designStatus: ai-draft
description: 使用日期字符串模型的带标签原生日期输入框。
model:
  type: string
  default: "''"
  description: YYYY-MM-DD 格式的纯日期字符串，或空字符串。
props:
  - name: label
    type: string
    required: true
    description: 输入框上可见的文字标签。
---

DateInput 渲染带标签的原生 `type="date"` 控件。模型是 `YYYY-MM-DD` 格式的纯日期字符串，不会转换为 UTC `Date`。浏览器负责本地化后的显示和日期选择界面。这不是库内的 DatePicker，也不提供按回调禁用单个日期的能力。

未声明的原生属性和监听器（包括 `min`、`max`、`step`、`name`、`disabled`、`readonly` 和 `required`）会应用到 input；`class` 和 `style` 会应用到外层 label。`@input` 监听器收到原生 `Event`。组件没有自定义事件或插槽。

## 用法

```vue
<script setup lang="ts">
import { DateInput } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const date = ref('2026-09-30')
</script>

<template>
  <div class="ui">
    <DateInput
      v-model="date"
      label="开始日期"
      name="start-date"
      min="2026-01-01"
      required
    />
  </div>
</template>
```
