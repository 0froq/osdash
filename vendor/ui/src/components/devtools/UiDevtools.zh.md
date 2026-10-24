---
title: UiDevtools
designStatus: ai-draft
description: 开发用浮层，显示页面上哪些组件来自组件库，哪些是项目自己写的。
props:
  - name: library
    type: RegExp
    description: 路径匹配该规则的文件算库组件。默认匹配含 vendor/ui 或 node_modules/@froq/ui 的路径。
  - name: ignore
    type: RegExp
    description: 路径匹配该规则的文件会被跳过。默认跳过其他 node_modules、.nuxt 和 devtools 自身。
---

UiDevtools 在右下角放一个小按钮 `ui`，点开是一个面板，把页面上所有单文件组件分两组列出：还没进库的，和来自库的。第一组就是接下来可以迁入库的候选。每一行有组件名、文件路径和页面上的实例数。

三个开关控制页面显示。Library 和 Project 会在每个渲染出来的组件外画轮廓并标上名字：库组件是实线强调色，项目自己的是虚线。Pages 把路由页面、布局和 `app.vue` 加进列表，默认隐藏，因为它们是版面而不是可复用组件。鼠标指向某一行，页面上对应组件会高亮，点击则滚动到第一个实例。

组件遍历运行中应用的组件树，读取每个组件的 `__file`。Vue 只在开发构建里写入它，所以 UiDevtools 在生产环境不渲染任何东西，发布前不用移除。没有渲染根元素的组件看不到。识别库文件依赖路径里有 `vendor/ui`，其他目录布局请传 `library`。面板文字是英文，没有本地化。请放在带 `class="ui"` 的元素内。

## 用法

```vue
<script setup lang="ts">
import { UiDevtools } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <UiDevtools />
  </div>
</template>
```
