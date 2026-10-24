---
title: Combobox
designStatus: ai-draft
description: 支持搜索和单选或多选的带标签组合框。
model:
  type: string | string[]
  default: "''"
  description: 单选时为选中项 value，多选时为选中 value 数组；多选示例应使用数组。
props:
  - name: label
    type: string
    required: true
    description: 显示在输入框上方的可见标签。
  - name: options
    type: ChoiceOption[]
    required: true
    description: 选项列表，每项包含唯一且非空的字符串 value、label 和可选 disabled。
  - name: toggleLabel
    type: string
    required: true
    description: 展开或收起选项列表按钮的无障碍名称。
  - name: clearLabel
    type: string
    required: true
    description: 清除选中项和搜索文本按钮的无障碍名称。
  - name: emptyLabel
    type: string
    required: true
    description: 没有匹配项且未提供 empty 插槽时显示的文字。
  - name: placeholder
    type: string
    description: 输入框占位文字。
  - name: multiple
    type: boolean
    default: "false"
    description: 启用多选；model 为字符串数组，已选项以只读 chip 显示。
  - name: disabled
    type: boolean
    default: "false"
    description: 禁用组合框及其选择和清除操作。
  - name: ignoreFilter
    type: boolean
    default: "false"
    description: 禁用内置选项过滤，供调用方提供已筛选的选项。
  - name: name
    type: string
    description: 表单字段名；组件位于表单内时提交选中项 value，不是输入文字。
  - name: dir
    type: "'ltr' | 'rtl'"
    description: 阅读和键盘方向；默认遵循 Reka UI 方向上下文。
  - name: portalTo
    type: string | HTMLElement
    description: Teleport 目标。默认使用最近的消费者 class 为 ui 的元素；找不到时以内联方式渲染。
slots:
  - name: option
    description: 接收 option 和 selected，以替换选项标签内容；不要放入交互后代。
  - name: empty
    description: 无匹配选项时替换 emptyLabel 的内容。
---

Combobox 用于在固定选项中搜索和选择，不支持自由创建选项。`options` 是 `ChoiceOption[]`，每项包含唯一且非空的 `value`、`label` 和可选的 `disabled`。单选时 `v-model` 为字符串，多选时为字符串数组；`multiple` 不会替调用方把现有模型类型转换成期望形状，建议始终匹配模式传入值。

窄类型的 TypeScript 单选模型必须包含用于清除的 `''`，例如 `ref<'' | 'vue' | 'react'>('vue')`。多选模型使用数组。选项标识应与消费端模型兼容；泛型不会验证远端数据，也不会根据 `multiple` 强制转换模型形状。

组件还支持 `v-model:search` 和 `v-model:open`。`search` 表示输入框当前文字，可能是用户查询，也可能是已选选项的显示标签；选择选项或输入框失焦时，Reka UI 会自动重置该值，因此它不是只包含用户查询的状态。`open` 表示选项列表是否展开。内部清除按钮会在自身变为禁用前将焦点移回输入框，然后同时清空选中值和搜索文字、关闭列表；单独删除搜索文字不会清除选中值。

多选时，已选值显示为只读 chip。要取消选择，请在选项列表中再次选择对应选项；chip 不提供删除按钮。模型中的未知 value 会保留，并以原 value 作为显示文字，不会自动丢弃。`ignoreFilter` 用于关闭内置筛选、由调用方传入筛选后的 `options`；异步请求的竞态和加载状态由调用方管理。`emptyLabel` 是 empty 插槽的默认内容。

`name` 将选中项 ID（即 `value`）提交为表单值，不会提交输入文字。透传的 `required` 会校验输入框文字，并不能保证用户选中了一个选项；若业务要求必须从选项中选择，请使用 Select 或 RadioGroup，或由调用方自行验证。`id` 由组件生成并用于关联可见标签，透传的 `id` 会被组件值覆盖。`class` 和 `style` 应用到外层包装；其他未声明属性会转发给内部输入框。

`option` 插槽接收 `{ option, selected }`，用于替换选项标签；不要放入按钮等交互后代。`empty` 插槽用于替换无匹配结果提示。组件的选项列表默认 Teleport 到最近的消费者 `class="ui"` 元素；找不到时以内联方式渲染。自定义 `portalTo` 目标需由调用方提供 UI token 和主题样式。样式和字体作用域由调用方提供；组件不会自行添加 `.ui`。

## 用法

通过 `name` 提交选中值要求组件放在表单内部。单选提交 `name=value`；多选提交 `name[0]=value` 等带索引字段，空数组不提供已选字段。透传的 `form` 属性只关联输入框，不会把隐藏的选择字段关联到外部表单。原生表单 reset 不会同步 Vue 模型，调用方也需重置模型。透传的 `readonly` 只禁止编辑文字，不禁止列表选择；要禁止全部交互请用 `disabled`。清除选择也会关闭列表。

```vue
<script setup lang="ts">
import type { ChoiceOption } from '@froq/ui/vue'
import { Combobox } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const selected = ref<string[]>(['vue'])
const search = ref('')
const open = ref(false)
const options: ChoiceOption[] = [
  { value: 'vue', label: 'Vue' },
  { value: 'react', label: 'React' },
  { value: 'svelte', label: 'Svelte' },
]
</script>

<template>
  <div class="ui">
    <Combobox
      v-model="selected"
      v-model:search="search"
      v-model:open="open"
      label="框架"
      :options="options"
      multiple
      toggle-label="切换选项"
      clear-label="清除选择"
      empty-label="没有匹配选项"
      name="frameworks"
      placeholder="搜索框架"
    />
  </div>
</template>
```
