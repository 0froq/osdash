---
title: Choice
designStatus: ai-draft
description: 一排词。被选中的词后面留着一枚着重号，着重号会走到下一个词。
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
    description: 页面上可见、用于命名这一组的标签。
  - name: disabled
    type: boolean
    default: "false"
    description: 禁用整组。
---

Choice 是在几个词里选一个，不是一叠方框。选中的词留在前景，其余的变淡。一枚着重号停在选中词的后面，选择变化时它走到下一个词。读者偏好减少动效时，着重号直接跳过去。

自定义按钮单选组只有一个 Tab 停靠。方向键、Home 和 End 移动选择，并跳过禁用项；带修饰键时不会拦截按键。如果当前值不存在或已禁用，第一个可用项会成为 Tab 入口，但不会因此修改模型。所有选项都禁用时，组内没有 Tab 入口。`disabled` 属性会禁用整组。

Choice 不会提交原生表单值：`v-model` 不是表单的 `name` 字段，组件也不提供原生 `required` 或 `name` 行为。如果表单需要提交该值，请由消费端提供 hidden input。

## 用法

```vue
<script setup lang="ts">
import { Choice } from '@froq/ui'
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
    <Choice
      v-model="tone"
      label="Tone"
      :options="options"
    />
  </div>
</template>
```
