---
title: RadioGroup
designStatus: ai-draft
description: 支持表单提交的原生单选输入组。
model:
  type: string | undefined
  description: 已选选项值；未选择时为 undefined。
props:
  - name: label
    type: string
    required: true
    description: 为单选组命名的 legend 文字。
  - name: options
    type: "ChoiceOption<T>[]"
    required: true
    description: 含 value、label 和可选禁用状态的选项。
  - name: name
    type: string
    description: 原生表单提交键；省略或为空时使用自动生成的唯一名称。
  - name: disabled
    type: boolean
    default: "false"
    description: 禁用 fieldset 及其中所有单选输入。
  - name: required
    type: boolean
    default: "false"
    description: 对该单选组应用原生必填约束。
  - name: form
    type: string
    description: 要关联的 HTML form 元素 ID。
---

RadioGroup 渲染原生 `<fieldset>` 和 `<legend>`，内部是带标签的 radio input。模型可选且没有默认值；它保存已选字符串值，或 `undefined`。原生选中行为、键盘操作和表单约束由浏览器提供。设置 `disabled: true` 的选项会变成禁用的 radio input。无效模型值或对应禁用选项的模型值不会被自动修正。

`name` 是实际的原生表单提交键。省略或设为空字符串时，RadioGroup 会使用 Vue 生成的唯一名称；需要有意义的表单数据时请显式提供 name。同一个表单中的不同组不要复用同一个 name。设置 `required` 后启用浏览器原生组约束：选择任意一个可用 radio 即可满足约束。如果输入不在 form 内部，可通过 `form` 指定 HTML form 的 ID 来关联。

未声明的属性会应用到根 fieldset，而不是每个 input。根 `id` 属于 fieldset；每个 input 都通过外层原生 label 与文字关联，调用方无需为 input 提供 ID。组件没有自定义插槽或事件。重置原生表单不会更新 Vue 模型，消费端也需要重置自己的状态。

与不包含原生表单值或必填校验的自定义按钮单选控件 `Choice`、`ChoiceCircle` 不同，RadioGroup 提供原生 radio input 和表单行为。它不会自动迁移或替换这些组件的 API。

## 用法

```vue
<script setup lang="ts">
import { RadioGroup } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const visibility = ref<string | undefined>()
const options = [
  { value: 'public', label: '公开' },
  { value: 'private', label: '私有' },
  { value: 'team', label: '团队', disabled: true },
]
</script>

<template>
  <div class="ui">
    <form id="profile-form">
      <RadioGroup
        v-model="visibility"
        :options="options"
        label="可见性"
        name="visibility"
        required
        form="profile-form"
      />
    </form>
  </div>
</template>
```
