---
title: Calendar
designStatus: ai-draft
description: 用 Gregorian 日期字符串表示选中日期的单月日历。
model:
  type: string
  default: "''"
  description: ISO 日期 `YYYY-MM-DD`；空字符串表示未选择。
props:
  - name: label
    type: string
    required: true
    description: 日历的无障碍名称。
  - name: locale
    type: string
    required: true
    description: 用于星期名称和日历本地化的 locale。
  - name: initialDate
    type: string
    required: true
    description: 初始显示月份的 Gregorian `YYYY-MM-DD` 日期；model 为空时必需。
  - name: prevLabel
    type: string
    required: true
    description: 上一月按钮的无障碍名称。
  - name: nextLabel
    type: string
    required: true
    description: 下一月按钮的无障碍名称。
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
    description: 禁用日期选择和日历控件。
  - name: readonly
    type: boolean
    default: "false"
    description: 保留月份浏览，但不允许选择日期。
  - name: preventDeselect
    type: boolean
    default: "false"
    description: 选中日期再次点击时是否保留选择；默认再次点击会清空 model。
  - name: weekStartsOn
    type: 0 | 1 | 2 | 3 | 4 | 5 | 6
    description: 一周起始日，0 表示星期日，6 表示星期六。
  - name: dir
    type: ltr | rtl
    description: 阅读方向。
  - name: initialFocus
    type: boolean
    default: "false"
    description: 挂载后将焦点移入日历。
slots:
  - name: day
    description: 自定义日期内容，参数为 `{ date, day, selected, disabled, today }`；内容不应包含交互式后代。
events:
  - name: viewChange
    payload: string
    description: 显示月份或键盘焦点的公历日期锚点改变时触发，不表示已选择该日期。
  - name: select
    payload: string
    description: 选择、取消选择或再次选择日期时触发；取消选择的值为空字符串。
---

Calendar 使用 Gregorian 日期，不包含时区语义。非空日期必须是有效的 `YYYY-MM-DD`，年份范围为 `0001` 到 `9999`；空字符串表示未选择。无效的非空 model、`initialDate`、`min` 或 `max` 会抛出 `RangeError`；`min` 晚于 `max` 也会抛出 `RangeError`。传入的 model 若在范围外会原样保留，不会自动修正。`locale` 必须是运行环境支持的 locale。

日历始终显示一个固定六周的月份网格，因此网格会包含相邻月份的日期；这些日期仍可选择，除非被 `min`、`max`、`isDateDisabled` 或 `disabled` 禁用。`today` 只是由调用方提供的标记，不会根据本地时钟自动计算。`initialDate` 决定空 model 时的初始显示月份；清空 model 不会重置当前浏览月份，只有 model 为空时 `initialDate` 的变化才会更新显示月份。

默认情况下，再次选择当前日期会取消选择并以 `''` 触发 `select`。设置 `preventDeselect` 后，再次选择当前日期会保留日期；该次选择仍会触发 `select`。`readonly` 仍允许浏览月份，但不允许选择日期。组件暴露 `focus()` 方法，可将焦点移到当前可用日期或日历控件；`initialFocus` 会在挂载后调用它。键盘交互使用方向键浏览日期、Enter/Space 选择，以及浏览器原生 Tab 导航；不提供日期范围选择或年份选择器。

组件没有表单字段或原生 `required`、`min`、`max` 表单校验。需要表单输入时使用 `DateInput` 或由调用方实现校验。未声明属性会应用到日历根元素。组件使用 UI 库 token；在带有 `class="ui"` 的元素内使用，并引入 `@froq/ui/style.css`。

## 用法

```vue
<script setup lang="ts">
import { Calendar } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const date = ref('2026-09-30')
</script>

<template>
  <div class="ui">
    <Calendar
      v-model="date"
      label="选择日期"
      locale="zh-CN"
      initial-date="2026-09-30"
      prev-label="上个月"
      next-label="下个月"
    />
  </div>
</template>
```
