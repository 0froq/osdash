---
title: Checkbox
designStatus: ai-draft
description: 由布尔值模型控制的带标签复选框。
model:
  type: boolean
  default: "false"
  description: 复选框是否已选中。
props:
  - name: label
    type: string
    required: true
    description: 显示在复选框旁边的文字。
---

Checkbox 将原生复选框与可见标签组合在一起。通过 `v-model` 以布尔值绑定选中状态；不要另传 `checked`、`true-value` 或 `false-value`。原生 `value` 属性用于表单提交，不控制选中状态。未声明的 `id`、`name`、`value`、`disabled`、`required`、ARIA 属性和事件监听器等会应用到内部 input；`class` 和 `style` 会应用到外层 label。

## 用法

```vue
<script setup lang="ts">
import { Checkbox } from '@froq/ui'
import { ref } from 'vue'

const accepted = ref(false)
</script>

<template>
  <div class="ui">
    <Checkbox
      v-model="accepted"
      label="接受条款"
    />
  </div>
</template>
```
