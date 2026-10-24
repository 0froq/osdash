---
title: Menu
designStatus: ai-draft
description: 支持嵌套子菜单的无障碍菜单。
model:
  type: boolean
  default: "false"
  description: 菜单是否打开，支持 v-model。
props:
  - name: label
    type: string
    required: true
    description: 菜单的无障碍名称，也是默认触发按钮文案。
  - name: items
    type: MenuItem[]
    required: true
    description: 菜单项及可选的嵌套子菜单项。
  - name: disabled
    type: boolean
    default: "false"
    description: 只禁用触发按钮；要禁用菜单项，请设置对应 MenuItem 的属性。
  - name: modal
    type: boolean
    default: "true"
    description: 控制打开菜单时外部交互是否采用模态行为。
  - name: dir
    type: "'ltr' | 'rtl'"
    description: 文本和键盘方向。默认使用 Reka UI 方向上下文；无上下文时为 ltr。
  - name: side
    type: "'top' | 'right' | 'bottom' | 'left'"
    default: bottom
    description: 相对触发按钮的首选方向；碰撞处理可能重新定位菜单。
  - name: align
    type: "'start' | 'center' | 'end'"
    default: start
    description: 相对触发按钮的首选对齐方式；碰撞处理可能重新定位菜单。
  - name: sideOffset
    type: number
    default: "8"
    description: 触发按钮与菜单内容之间的像素距离。
  - name: portalTo
    type: string | HTMLElement
    description: Teleport 目标。默认使用最近的消费者 class 为 ui 的元素；找不到时以内联方式渲染。
events:
  - name: select
    payload: MenuItem, Event
    description: 选择可选叶子菜单项时触发，载荷为菜单项和原始可取消选择事件。阻止事件默认行为可保持菜单打开。
slots:
  - name: trigger
    description: 可选的单个真实 button，或会转发触发器属性和事件的按钮组件。
  - name: item
    description: 替换菜单项的标签内容并接收 item。内容需保持非交互，不要添加交互子元素。
---

Menu 是支持嵌套子菜单的无障碍菜单。trigger 插槽必须最终渲染为单个真实按钮；若使用按钮组件，它必须转发 primitive 提供的属性和事件。未提供该插槽时，触发按钮使用 `label` 文案。`disabled` 只作用于触发按钮。

`items` 使用共享 `MenuItem` 结构：`{ value, label, disabled?, separatorBefore?, children? }`。同级菜单项的 `value` 需唯一。非空的 `children` 数组会使该项成为子菜单触发项，本身不能被选中；省略或为空的 `children` 数组表示可选择的叶子项。`separatorBefore` 会在该项前添加分隔线，但同级列表首项前不会添加。`item` 插槽接收 `{ item }`，只替换标签内容。请不要在其中放按钮、链接或其他交互后代，以免破坏菜单的键盘交互。

选择叶子项会触发 `select`，携带 `MenuItem` 和原始可取消事件。阻止该事件的默认行为可使菜单保持打开。每个菜单项的操作由调用方负责；菜单项本身不代表链接、路由、复选框或单选状态。Reka UI 提供菜单键盘行为，包括方向键导航、按字符搜索、按 Escape 关闭和跳过禁用项。

组件通过布尔值 `v-model` 控制打开状态，默认值为 `false`。`modal` 默认为 `true`。`dir` 可设为 `ltr` 或 `rtl`；省略时沿用 Reka UI 方向上下文，没有上下文时回退到 `ltr`。菜单优先使用 `side`、`align` 和 `sideOffset`，并以 12 像素碰撞间距自动处理边界碰撞。未声明属性会转发到菜单内容，不会转发给触发按钮。组件根节点不会添加 `.ui` 类。

默认情况下，内容会 Teleport 到最近的消费者 `class="ui"` 元素；找不到时则以内联方式渲染。在服务端只渲染触发按钮，打开后才会在客户端显示菜单内容。自定义 `portalTo` 目标必须已经存在，并由消费者提供主题和 UI token。本库的 token 契约不包含 Reka UI CSS 变量。在调用方引入 `style.css`，并提供 `.ui` 祖先元素，以供库样式和默认 portal 目标使用。

## 用法

```vue
<script setup lang="ts">
import type { MenuItem } from '@froq/ui/vue'
import { Button, Menu } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const open = ref(false)
const items: MenuItem[] = [
  { value: 'edit', label: '编辑' },
  {
    value: 'export',
    label: '导出',
    children: [
      { value: 'pdf', label: 'PDF' },
      { value: 'csv', label: 'CSV' },
    ],
  },
]

function selectItem(item: MenuItem, event: Event) {
  if (item.value === 'edit') {
    event.preventDefault()
    // 执行由调用方负责的操作，同时保持菜单打开。
  }
}
</script>

<template>
  <div class="ui">
    <Menu
      v-model="open"
      label="文档操作"
      :items="items"
      @select="selectItem"
    >
      <template #trigger>
        <Button>文档操作</Button>
      </template>
    </Menu>
  </div>
</template>
```
