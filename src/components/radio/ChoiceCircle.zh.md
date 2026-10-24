---
title: ChoiceCircle
designStatus: ai-draft
description: 和 Choice 一样的单选，选中的词外面画着一圈松的环。
model:
  type: T
  required: true
  description: 当前选中项的值。
props:
  - name: options
    type: "ChoiceOption<T>[]"
    required: true
    description: 这些词。每项有 value 和 label，也可以设置为禁用。
  - name: label
    type: string
    description: 这一组的无障碍名称，不会显示在页面上。
  - name: disabled
    type: boolean
    default: "false"
    description: 禁用整组。
---

ChoiceCircle 和 Choice 是同一种单选。词的后面没有着重号，选中的词外面画着一圈松的椭圆。每次改选，环会再画一遍。减少动效时不画，环直接停在那里。

键盘行为与 Choice 相同：自定义按钮单选组只有一个 Tab 停靠；方向键、Home 和 End 移动选择并跳过禁用项，带修饰键时不会拦截按键。如果当前值不存在或已禁用，第一个可用项会成为 Tab 入口，但不会因此修改模型；所有选项都禁用时，组内没有 Tab 入口。`disabled` 属性会禁用整组。

ChoiceCircle 不会提交原生表单值：`v-model` 不是表单的 `name` 字段，组件也不提供原生 `required` 或 `name` 行为。如果表单需要提交该值，请由消费端提供 hidden input。

## 用法

```vue
<script setup lang="ts">
import { ChoiceCircle } from '@froq/ui'
import { ref } from 'vue'

const tone = ref('plain')
const options = [
  { value: 'quiet', label: 'quiet' },
  { value: 'plain', label: 'plain' },
  { value: 'loud', label: 'loud' },
]
</script>

<template>
  <div class="ui">
    <ChoiceCircle
      v-model="tone"
      label="Tone"
      :options="options"
    />
  </div>
</template>
```
