---
title: TextArea
designStatus: ai-draft
description: 可设置行数的多行文本框。
model:
  type: string
  default: "''"
  description: 当前文本值。
props:
  - name: label
    type: string
    required: true
    description: 文本框上显示的文字标签。
  - name: rows
    type: number
    default: "3"
    description: 可见文本行数。
---

TextArea 渲染带标签的多行文本框。通过 `v-model` 绑定文本值，并用 `rows` 设置可见行数。未声明的原生属性（如 `id`、`name`、`disabled`、`required`、`readonly`、`placeholder`、ARIA 属性和事件监听器）会应用到内部 textarea；`class` 和 `style` 会应用到外层 label。使用 `v-model` 传值，不要另传 `value`。

## 用法

```vue
<script setup lang="ts">
import { TextArea } from '@froq/ui'
import { ref } from 'vue'

const note = ref('')
</script>

<template>
  <div class="ui">
    <TextArea
      v-model="note"
      label="备注"
      :rows="4"
    />
  </div>
</template>
```
