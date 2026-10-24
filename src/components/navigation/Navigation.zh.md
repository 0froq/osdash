---
title: Navigation
designStatus: ai-draft
description: 由活动值模型控制的扁平链接栏。
model:
  type: string
  default: "''"
  description: 当前选中条目的 value。
props:
  - name: items
    type: NavigationItem[]
    required: true
    description: 扁平条目数组，每项含唯一 value、label 和可选 href。
  - name: current
    type: "'page' | 'location'"
    default: page
    description: 活动链接使用的 aria-current 值。
slots:
  - name: link
    description: 接收 item 和 props（NavigationLinkProps），用于自定义链接。
---

Navigation 显示一栏可换行的扁平链接。它不是 tabs 控件：不实现 tab panel 或方向键导航。默认锚点链接保留浏览器原生 Tab 和 Enter 行为。`v-model` 保存活动条目的 `value`。页内锚点链接可设 `current="location"`；默认值为 `page`。

默认链接使用条目的 `href`。点击没有 `href` 的条目只会选中，不会导航。带修饰键的点击保留浏览器链接行为且不改变选择状态。若其他处理器阻止了点击，Navigation 不会更新选择。link 插槽接收 `item` 和 `props`（`NavigationLinkProps`）；将提供的 props 绑定到链接，可保留默认行为和无障碍属性。

Navigation 不提供文案、路由 URL 或滚动跟踪。条目文字和 URL、路由状态到 `v-model` 的映射，以及滚动监听都由消费端实现。路由链接可通过插槽适配器移除传入 props 中的 `href` 和 `onClick`，绑定剩余 props，将条目 URL 传给 `to`，并根据已确认的路由更新模型。

组件不会自行添加 `.ui` 作用域类。调用方需引入 `style.css`，并将 Navigation 放在带有 `class="ui"` 的外层元素中。

## 用法

```vue
<script setup lang="ts">
import { Navigation } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const active = ref('guide')
const items = [
  { value: 'guide', label: '指南', href: '#guide' },
  { value: 'components', label: '组件', href: '#components' },
]
</script>

<template>
  <div class="ui">
    <Navigation
      v-model="active"
      :items="items"
      current="location"
      aria-label="文档导航"
    />
  </div>
</template>
```

需要复用无样式行为时，可从 `@froq/ui/vue` 导入 `useNavigation(active)`，它返回 `isActive(item)` 和 `activate(event, item)`。
