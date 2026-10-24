---
title: FileUpload
designStatus: ai-draft
description: 带标签并报告已选文件的原生文件输入。
props:
  - name: label
    type: string
    required: true
    description: 原生文件输入的可见文本标签。
  - name: resetKey
    type: string | number
    description: 清空键。值变化时清空原生输入，并触发包含空文件列表的 change。
events:
  - name: change
    payload: File[]
    description: 原生输入发生变化时触发，载荷是已选文件；清空操作触发空数组。
  - name: cancel
    payload: Event
    description: 转发到文件输入的原生 cancel 事件，不会被当作空文件列表的 change。
---

FileUpload 渲染带有可见 `label` 的原生文件输入。它没有 `v-model`；监听组件的 `change` 事件即可获取 `File[]`。组件实例暴露 `clear()` 方法。修改 `resetKey` 或调用 `clear()` 会清空原生输入，并以 `[]` 触发 `change`。

`accept`、`multiple`、`capture`、`name`、`required` 和 `disabled` 等原生文件输入属性会转发给 input。`class` 和 `style` 会应用到外层 label。输入类型固定为 `file`，不要传入 `value`。浏览器不允许 JavaScript 预填文件输入。`accept` 只是文件选择器的提示，不是文件校验。FileUpload 不会上传文件，也不会在应用状态中保存它们。调用方应自行保存已选文件，并在清空或重置表单时同步这些状态。原生 `cancel` 事件会透传，且与空数组的 `change` 事件不同。

组件没有插槽。样式只使用 UI 库 token，不依赖字体、路由或业务状态。在调用方引入 `style.css`，并将组件放在带有 `class="ui"` 的元素内。

## 用法

```vue
<script setup lang="ts">
import { FileUpload } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const resetKey = ref(0)
const files = ref<File[]>([])

function handleCancel() {
  console.info('已取消文件选择')
}
</script>

<template>
  <div class="ui">
    <FileUpload
      label="附件"
      accept="image/*"
      multiple
      :reset-key="resetKey"
      @change="files = $event"
      @cancel="handleCancel"
    />
    <button
      type="button"
      @click="resetKey++"
    >
      清空所选文件
    </button>
    <p>已选 {{ files.length }} 个文件</p>
  </div>
</template>
```
