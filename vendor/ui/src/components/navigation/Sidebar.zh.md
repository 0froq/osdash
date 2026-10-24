---
title: Sidebar
designStatus: ai-draft
description: 支持分组、多层级、顶层折叠与选中框过渡的侧边导航。
model:
  type: string
  default: "''"
  description: 当前条目的 value。所有分组与层级中的 value 必须唯一。
props:
  - name: groups
    type: SidebarGroup[]
    required: true
    description: 分组条目。条目包含 value、label，可选 href 和 children。
  - name: foldable
    type: boolean
    default: 'false'
    description: 允许顶层有子项的路由折叠。分组标题不会折叠。
slots:
  - name: link
    description: 提供 item 和 props。将 props 绑定到链接，保留选中行为、样式和无障碍属性。
---

Sidebar 保持单栏，子项通过缩进与引导线区分层级。选中项使用灰度背景框和短强调色竖线。同一分组内切换时框选平滑移动，跨分组直接定位；减少动效模式下不移动。

`v-model` 是条目的 `value`，不是路由。Sidebar 不依赖路由框架。默认用 `href` 渲染链接，没有 `href` 时只更新选中状态。带修饰键的点击保留正常链接行为，不改变选中项。

开启 `foldable` 后，非当前的顶层分支默认收起。独立按钮控制折叠，路由文字仍可跳转。选中变化会展开对应顶层分支；手动收起当前分支时，选中框落在父项上。

## 用法

```vue
<script setup lang="ts">
import type { SidebarGroup } from '@froq/ui'
import { Sidebar } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const active = ref('install')
const groups: SidebarGroup[] = [{
  label: '指南',
  items: [{
    value: 'start',
    label: '开始使用',
    children: [{ value: 'install', label: '安装' }],
  }],
}]
</script>

<template>
  <div class="ui">
    <Sidebar
      v-model="active"
      :groups="groups"
      foldable
    />
  </div>
</template>
```

## 路由适配

通过 `link` 插槽使用项目的路由链接。把提供的 `props` 绑定到实际链接元素，其中包含 class、href、aria-current 和点击处理。如果路由组件使用 `to`，绑定时去掉 `href`，改将 `item.href` 传给 `to`。在项目里将选中值与确认后的路由保持同步。

`SidebarGroup`、`SidebarItem`、`SidebarLinkProps` 从 `@froq/ui` 与 `@froq/ui/vue` 导出。无样式行为 `useSidebar(groups, active, foldable)` 从 `@froq/ui/vue` 导出。

容器宽度、吸顶位置与窄屏滚动由调用方布局负责。
