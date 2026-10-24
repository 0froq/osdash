---
title: FormField
designStatus: ai-draft
description: 为单个表单控件关联标签、描述和错误提示。
props:
  - name: label
    type: string
    required: true
    description: 可见标签及控件的无障碍名称。
  - name: id
    type: string
    description: 实际控件 ID；不提供时由 Vue useId 生成稳定值。
  - name: description
    type: string
    description: 可选帮助文字，通过 aria-describedby 关联。
  - name: error
    type: string
    description: 调用方提供的错误文字；非空值将控件标记为无效。
  - name: required
    type: boolean
    default: "false"
    description: 可见必填标记及原生、ARIA 必填控件属性。
slots:
  - name: default
    description: 接收 controlProps（FieldControlProps），应绑定到实际控件。
---

FormField 负责无障碍关联，不管理值或校验，没有模型。默认插槽接收 `controlProps`：`id`、`required`、`aria-labelledby`、`aria-describedby`、`aria-invalid` 和 `aria-required`。将它们绑定到单个真实 input，或会向实际控件透传这些属性的组件。标签的 `for` 指向此 ID；描述和错误拥有各自的 ID。显式提供的 `id` 必须在文档中唯一。

错误由调用方的校验逻辑提供。它不会自动进行动态播报；FormField 不提交、重置、解析或校验业务数据。`required` 仅在支持它的原生控件上参与约束校验，ARIA 不会实现校验。调用方应协调原生 form reset 与 Vue 状态重置。

简单字段使用 TextInput、NumberInput 自带的标签即可，不要为了添加第二个可见标签再包 FormField。一组控件应使用原生 fieldset、legend，不要把同一 ID 绑定给多个控件。FormField 本身的原生属性落在外层容器，控件属性应在插槽中传入。

## 用法

```vue
<script setup lang="ts">
import { FormField } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const title = ref('')
const error = ref<string>()
</script>

<template>
  <div class="ui">
    <FormField
      label="标题"
      description="使用简短、容易识别的名称。"
      :error="error"
      required
    >
      <template #default="{ controlProps }">
        <input
          v-bind="controlProps"
          v-model="title"
          class="ui-field-control"
          type="text"
          name="title"
        >
      </template>
    </FormField>
  </div>
</template>
```

`FieldControlProps` 从 `@froq/ui` 和 `@froq/ui/vue` 导出。
