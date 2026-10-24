---
title: Pagination
designStatus: ai-draft
description: 使用原生按钮或链接切换页码的分页器。
model:
  type: number
  default: "1"
  description: 当前页 model。显示值会有限化、向下取整并限制到有效范围，但不会改写父级 model。
props:
  - name: label
    type: string
    required: true
    description: navigation 地标的无障碍名称。
  - name: pages
    type: number
    required: true
    description: 总页数。有限值会向下取整并限制到 Number.MAX_SAFE_INTEGER；无效值会变为零。
  - name: previousLabel
    type: string
    required: true
    description: 上一页控件的可见文案和无障碍标签。
  - name: nextLabel
    type: string
    required: true
    description: 下一页控件的可见文案和无障碍标签。
  - name: pageLabel
    type: (page: number) => string
    required: true
    description: 为指定页码生成无障碍标签。
  - name: siblingCount
    type: number
    default: "1"
    description: 当前页两侧显示的页数。按 pages 相同规则取整、限制并规范化。
  - name: disabled
    type: boolean
    default: "false"
    description: 禁用所有页码控件。
  - name: href
    type: (page: number) => string
    description: 可选 URL 回调。提供后，可用控件渲染为真实链接。
slots:
  - name: control
    description: 为上一页、数字页和下一页控件提供 page、kind、tag、props。应保留传入的原生标签、绑定 props 并遵循 disabled 状态。
---

Pagination 渲染带标签的 `<nav>`，并显示一个页码窗口：包含首页、末页、当前页及其相邻页；省略的页码之间使用纯装饰性省略号。`pages` 和 `siblingCount` 会被向下取整为有限非负数，并限制到 `Number.MAX_SAFE_INTEGER`；无效值会变为零。当前显示页会向下取整，并限制在 `1..max(1, pageCount)`。model 为非有限数值时显示第 1 页。显示值的规范化不会改写父级 model。总页数为零时，不显示数字页，并禁用上一页/下一页控件。

默认情况下，可用控件是原生按钮。提供 `href` 后，可用控件改为真实锚点；禁用控件仍是原生禁用按钮。对于锚点控件，普通主键单击会将数字 model 更新为选中页；Ctrl、Meta、Shift、Alt 修饰单击、非主键单击或已被阻止的事件不会更新 model，因此原生链接行为仍可用。对于任一原生控件，已被阻止的事件都不会更新 model。

`control` 插槽接收 `{ page, kind, tag, props }`，其中 `kind` 为 `page`、`previous` 或 `next`，`tag` 为 `a` 或 `button`。请渲染指定的原生标签并绑定传入的 `props`，保留 `disabled` 和 `aria-disabled` 语义。类型 `PaginationControlProps` 从 `@froq/ui/vue` 导出。组件不会获取数据、集成路由或通过 live region 播报页码变化。它使用浏览器原生 Tab 导航和按钮的 Enter/Space 激活；它不是 tablist，也不实现方向键焦点轮转。

URL 与标签回调应是没有副作用的渲染函数；URL 回调需返回有效的非空地址。路由适配放在 `control` 插槽中，不进入库。禁用条目应保留原生禁用按钮，不要仅给仍可跳转的链接加 `aria-disabled`。

未声明属性会应用到 `<nav>`。Pagination 使用 UI 库 token，不依赖字体、路由或业务数据。在调用方引入 `style.css`，并将组件放在带有 `class="ui"` 的元素内。

## 用法

```vue
<script setup lang="ts">
import { Pagination } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const page = ref(3)
const pages = 24
function pageLabel(value: number) {
  return `前往第 ${value} 页`
}
</script>

<template>
  <div class="ui">
    <Pagination
      v-model="page"
      label="搜索结果页码"
      :pages="pages"
      previous-label="上一页"
      next-label="下一页"
      :page-label="pageLabel"
      :sibling-count="1"
      :href="value => `/search?page=${value}`"
    />
  </div>
</template>
```
