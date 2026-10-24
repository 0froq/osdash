---
title: Accordion
designStatus: ai-draft
description: 支持单项或多项展开的折叠面板组。
model:
  type: string[]
  default: "[]"
  description: 已展开条目的 value 数组。
props:
  - name: items
    type: ChoiceOption[]
    required: true
    description: 条目数组，value 必须稳定且唯一，并含有 label；每项可设为禁用。
  - name: multiple
    type: boolean
    default: "false"
    description: 是否允许同时展开多个条目。
  - name: disabled
    type: boolean
    default: "false"
    description: 禁用所有条目的切换。
slots:
  - name: default
    description: 每个面板的内容，接收 item 和 open。
---

Accordion 为条目列表组合 Collapsible 面板。`v-model` 是已展开条目的 value 数组，默认空数组。单项模式（`multiple="false"`）只将模型中的第一个 value 视为展开；打开另一项会替换它。多项模式下，数组中的每个 value 对应一个展开面板。两种模式都允许全部关闭。条目自身的 `disabled` 和组级 `disabled` 都会阻止用户切换。

每个触发器复用 Collapsible 的原生按钮行为，包括 Enter 和 Space，以及面板关闭且焦点在面板内部时将焦点返回触发器。Accordion 不强制设置 ARIA accordion role，也不添加触发器之间的方向键导航。default 插槽会收到每个条目的 `item` 和 `open` 状态。

## 用法

```vue
<script setup lang="ts">
import { Accordion } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const openItems = ref<string[]>([])
const items = [
  { value: 'shipping', label: '配送' },
  { value: 'returns', label: '退货' },
]
</script>

<template>
  <div class="ui">
    <Accordion
      v-model="openItems"
      :items="items"
      :multiple="true"
    >
      <template #default="{ item, open }">
        <p>{{ item.label }}详情{{ open ? '已展开。' : '已收起。' }}</p>
      </template>
    </Accordion>
  </div>
</template>
```
