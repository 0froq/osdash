---
title: ContextMenu
designStatus: ai-draft
description: 用于可聚焦目标区域的右键及长按菜单。
props:
  - name: label
    type: string
    required: true
    description: 可聚焦目标和菜单的无障碍名称。
  - name: items
    type: MenuItem[]
    required: true
    description: 菜单项，可含禁用项、分隔符和嵌套子菜单。
  - name: disabled
    type: boolean
    default: "false"
    description: 禁止在目标上打开菜单，但不禁用目标内的子内容。
  - name: modal
    type: boolean
    default: "true"
    description: 打开菜单时是否限制外部交互。
  - name: dir
    type: "'ltr' | 'rtl'"
    description: 菜单文字和键盘方向；默认沿用 Reka UI 方向上下文，无上下文时为 ltr。
  - name: portalTo
    type: "string | HTMLElement"
    description: Teleport 目标。默认使用最近的消费者 class 为 ui 的元素；找不到时以内联方式渲染。
events:
  - name: openChange
    payload: boolean
    description: 内部菜单状态发生且被接受的变化时通知消费端；这不是受控模型。
  - name: select
    payload: MenuItem, Event
    description: 选择可选叶子项时触发，包含菜单项和原始可取消选择事件。阻止事件默认行为可保持菜单打开。
slots:
  - name: default
    description: 必需的目标区域内容，用于触发上下文菜单。
  - name: item
    description: 替换菜单项的标签文字并接收 item；内容保持非交互。
---

ContextMenu 会将默认插槽包在一个有名称且可聚焦的 `div` 中，该元素带有 `role="group"` 和 `aria-haspopup="menu"`。右键或触屏/触控笔长按会打开菜单；长按延迟使用 Reka UI 的 700 毫秒默认值。包装元素还会将 Context Menu 键和 Shift+F10 转换为其中心位置的上下文菜单事件。该键盘桥接只处理事件目标正是包装元素的按键，不会拦截从子元素冒泡的 keydown。

组件内部管理打开状态，没有 `v-model` 或 `open` 属性。`openChange` 仅用于通知状态变化。选择叶子项时会触发 `select`，携带 `MenuItem` 和原始可取消事件。阻止事件默认行为可让菜单保持打开。每个菜单项的操作由消费端负责。

菜单项使用共享的递归 `MenuItem` 结构：`{ value, label, disabled?, separatorBefore?, children? }`。同级 value 必须唯一。非空的 `children` 数组会使该项成为子菜单触发项，不能直接选择；省略或为空的 `children` 表示叶子项。`separatorBefore` 会在该项前添加分隔符，但同级列表首项前不会添加。`item` 插槽只替换标签内容，并递归应用；插槽内容不能包含交互后代。

`disabled` 会禁止目标包装元素上的菜单打开交互，但不会禁用其中的子内容。该属性切换时，目标和默认插槽会保持挂载。禁用会关闭已打开的菜单，并拦截已排队的长按回调，避免过期菜单打开；helper 不会取消 Reka UI 内部的 timeout，因此回调仍可能执行，但会被门控。重新启用不会自行打开菜单；下一次真实的 `contextmenu` 事件或触屏/触控笔 `pointerdown` 才会重新允许打开。禁用时不拦截原生右键菜单，并将 WebKit touch callout 恢复为默认值；原生菜单行为由浏览器决定。包装元素是可聚焦的具名 group，不是按钮。不要用它替代依赖原生上下文菜单的文本编辑器或其他控件；需要显式操作触发器时可使用普通 dropdown menu。

## 暴露的方法

- `close(): void` 可通过组件 ref 关闭当前菜单或拒绝待执行的打开，不会卸载目标。组件不会自动监听全局滚动或路由变化；关闭策略由消费端决定并执行。

未声明的属性会透传到菜单内容，不会传到目标包装元素。默认情况下，内容会 Teleport 到最近的消费者 `class="ui"` 元素；找不到时则在客户端以内联方式渲染。SSR 时只渲染目标，菜单内容在客户端出现。关闭时菜单内容会卸载。自定义 `portalTo` 目标必须存在，并由消费者提供主题和 UI token。消费者需引入 `style.css` 并提供 `.ui` 作用域。

## 用法

```vue
<script setup lang="ts">
import type { MenuItem } from '@froq/ui/vue'
import { ContextMenu } from '@froq/ui'
import { useTemplateRef } from 'vue'
import '@froq/ui/style.css'

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
const menu = useTemplateRef<{ close: () => void }>('menu')

function selectItem(item: MenuItem, event: Event) {
  if (item.value === 'edit') {
    event.preventDefault()
    // 执行消费端负责的操作，同时保持菜单打开。
  }
}
</script>

<template>
  <div class="ui">
    <ContextMenu
      ref="menu"
      label="文档上下文菜单"
      :items="items"
      @select="selectItem"
      @open-change="open => console.info('菜单状态：', open)"
    >
      <div class="document-preview">
        右键此区域，或聚焦后按 Shift+F10。
      </div>
      <template #item="{ item }">
        {{ item.label }}
      </template>
    </ContextMenu>
    <button
      type="button"
      @click="menu?.close()"
    >
      关闭上下文菜单
    </button>
  </div>
</template>
```
