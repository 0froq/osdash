---
title: Toggle
designStatus: ai-draft
description: 两个词共用一个开关。控件只和当前这个词一样宽。
model:
  type: boolean
  default: "false"
  description: 开关是否打开。
props:
  - name: label
    type: string
    required: true
    description: 无障碍名称，页面上不显示。
  - name: offLabel
    type: string
    default: "off"
    description: 关闭时显示的词。
  - name: onLabel
    type: string
    default: "on"
    description: 打开时显示的词。
  - name: disabled
    type: boolean
    default: "false"
    description: 阻止用户点击切换开关。
---

Toggle 是由两个词做成的开关。只有当前这个词留在前景，控件的宽度跟着这个词走，不会同时给两个词留空。读屏用的名字是 `label`。页面上看到的是 `offLabel` 和 `onLabel`。

`disabled` 为 true 时，用户无法切换开关；父组件仍可更新 `v-model` 的值。

## 用法

```vue
<script setup lang="ts">
import { Toggle } from '@froq/ui'
import { ref } from 'vue'

const aloud = ref(false)
</script>

<template>
  <p class="ui">
    Read it
    <Toggle
      v-model="aloud"
      label="sound"
      off-label="quiet"
      on-label="aloud"
    />.
  </p>
</template>
```
