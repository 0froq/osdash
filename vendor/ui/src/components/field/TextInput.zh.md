---
title: TextInput
designStatus: ai-draft
description: 带标签的单行文本框，支持少量输入类型。
model:
  type: string
  default: "''"
  description: 当前输入值。
props:
  - name: label
    type: string
    required: true
    description: 输入框上显示的文字标签。
  - name: type
    type: "'text' | 'email' | 'search'"
    default: text
    description: 原生输入类型。
---

TextInput 渲染带标签的单行输入框。通过 `v-model` 绑定输入值；`type` 可设为 `text`、`email` 或 `search`。未声明的原生属性（如 `id`、`name`、`disabled`、`required`、`readonly`、`placeholder`、ARIA 属性和事件监听器）会应用到内部 input；`class` 和 `style` 会应用到外层 label。使用 `v-model` 传值，不要另传 `value`。

## 用法

```vue
<script setup lang="ts">
import { TextInput } from '@froq/ui'
import { ref } from 'vue'

const email = ref('')
</script>

<template>
  <div class="ui">
    <TextInput
      v-model="email"
      label="邮箱"
      type="email"
      name="email"
      autocomplete="email"
      placeholder="you@example.com"
    />
  </div>
</template>
```
