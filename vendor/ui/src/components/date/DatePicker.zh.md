---
title: DatePicker
designStatus: ai-draft
description: 通过弹出日历选择单个 Gregorian 日期。
model:
  type: string
  default: "''"
  description: ISO 日期 `YYYY-MM-DD`；空字符串表示未选择。
props:
  - name: label
    type: string
    required: true
    description: 日期选择器及其日历的无障碍名称。
  - name: locale
    type: string
    required: true
    description: 用于日期显示和日历本地化的 locale。
  - name: initialDate
    type: string
    required: true
    description: 空 model 时日历初始显示月份的 Gregorian `YYYY-MM-DD` 日期。
  - name: placeholder
    type: string
    required: true
    description: model 为空时触发器显示的占位文案。
  - name: prevLabel
    type: string
    required: true
    description: 上一月按钮的无障碍名称。
  - name: nextLabel
    type: string
    required: true
    description: 下一月按钮的无障碍名称。
  - name: clearLabel
    type: string
    required: true
    description: 清空按钮的无障碍名称。
  - name: closeLabel
    type: string
    required: true
    description: 关闭日历按钮的文案。
  - name: min
    type: string
    description: 可选最早日期（含），格式为 `YYYY-MM-DD`。
  - name: max
    type: string
    description: 可选最晚日期（含），格式为 `YYYY-MM-DD`。
  - name: today
    type: string
    description: 可选的调用方指定日期标记；组件不会自行决定本地今天。
  - name: isDateDisabled
    type: (date: string) => boolean
    description: 日期禁用回调；接收 ISO 日期字符串。
  - name: disabled
    type: boolean
    default: "false"
    description: 禁用触发器和清空操作，并隐藏弹出日历；不会自动改写 open model。
  - name: readonly
    type: boolean
    default: "false"
    description: 允许打开并浏览日历，但不允许选择或清空日期。
  - name: weekStartsOn
    type: 0 | 1 | 2 | 3 | 4 | 5 | 6
    description: 一周起始日，0 表示星期日，6 表示星期六。
  - name: dir
    type: ltr | rtl
    description: 阅读方向。
  - name: name
    type: string
    description: 提供时渲染隐藏表单字段的 name。
  - name: form
    type: string
    description: 可选关联表单的 id，传给隐藏表单字段。
  - name: portalTo
    type: string | HTMLElement
    description: 可选 portal 目标；未提供时使用最近的 `.ui` 容器，找不到则内联渲染。
slots:
  - name: day
    description: 自定义日期内容，参数为 `{ date, day, selected, disabled, today }`；内容不应包含交互式后代。
---

DatePicker 的日期值是 Gregorian `YYYY-MM-DD` 字符串，空字符串表示未选择，不携带时区。有效年份范围为 `0001` 到 `9999`；无效的非空 model、`initialDate`、`min` 或 `max` 会抛出 `RangeError`，`min` 晚于 `max` 也会抛出 `RangeError`。外部传入的越界日期会保留，不会自动修正。`locale` 必须是运行环境支持的 locale。`initialDate` 用于空 model 时的初始月份；清空日期不会重置已浏览月份，model 为空时 `initialDate` 变化才会更新月份。

弹出日历固定显示六周，包含的相邻月份日期也可以选择，除非受 `min`、`max` 或 `isDateDisabled` 限制。`today` 是调用方指定的日期标记，不是组件自动计算的本地今天。`readonly` 可打开并浏览日历，但不能选择日期或使用清空按钮。`disabled` 会隐藏弹出内容并禁用触发器与清空按钮，但不会自动重写 `v-model:open`；若 disabled 时 open 为 true，稍后启用时弹层仍可能打开。

选择日期（包括再次选择当前日期）、清空或关闭都会关闭弹层。打开时焦点进入当前可用日期；Escape、外部点击或关闭按钮会关闭弹层。关闭后焦点返回触发器；由外部交互触发关闭时保留外部目标的焦点。日期网格支持方向键、Enter/Space 与原生 Tab 导航。

提供 `name` 时，组件渲染值为 ISO 日期字符串的隐藏 input，`form` 可指定其关联表单。该字段不提供浏览器原生 `required`、`min` 或 `max` 校验；需要日期输入或原生校验时使用 `DateInput`，或由调用方自行校验。`class` 和 `style` 应用于外层容器；其他未声明属性会传给触发器按钮。portal 默认挂到最近的 `.ui` 容器；自定义 portal 目标需由调用方提供主题 token。SSR 时弹出内容不会渲染，客户端打开后才挂载。组件使用 UI 库 token；引入 `@froq/ui/style.css`，并置于带有 `class="ui"` 的元素内。

## 用法

清空会先将焦点移回触发器，避免停留在随后禁用的清空按钮上。空 model 再次打开时保留最近浏览的日期锚点；有选中值时仍以选中日期确定打开月份。原生 form reset 不会同步 Vue model，调用方也需重置模型。

```vue
<script setup lang="ts">
import { DatePicker } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const date = ref('')
const open = ref(false)
</script>

<template>
  <div class="ui">
    <DatePicker
      v-model="date"
      v-model:open="open"
      label="日期"
      locale="zh-CN"
      initial-date="2026-09-30"
      placeholder="选择日期"
      prev-label="上个月"
      next-label="下个月"
      clear-label="清空日期"
      close-label="关闭日历"
      name="date"
    />
  </div>
</template>
```
