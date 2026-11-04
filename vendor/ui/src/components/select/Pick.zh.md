---
title: Pick
designStatus: reviewed
description: 可换行的多选 token 组，用于过滤器等场景，可限制展示行数。
model:
  type: string[]
  default: '[]'
  description: 已选中的选项值，支持 v-model。
props:
  - name: label
    type: string
    required: true
    description: 字段标签，同时为辅助技术命名整个组。
  - name: options
    type: PickOption[]
    required: true
    description: 可选的 token。每个可以带一个尾部 `count` 计数。
  - name: rows
    type: number
    default: '2'
    description: 截断前显示的行数。0 表示全部显示。
  - name: moreLabel
    type: string
    default: "'Show all'"
    description: 列表溢出时展开控件的文案。
  - name: lessLabel
    type: string
    default: "'Show less'"
    description: 展开状态下收起控件的文案。
  - name: dir
    type: "'ltr' | 'rtl'"
    default: "'ltr'"
    description: 焦点漫游的阅读方向。
  - name: loop
    type: boolean
    default: 'true'
    description: 焦点是否在 token 列表中循环。
  - name: disabled
    type: boolean
    default: 'false'
    description: 禁用整个组。
slots:
  - name: option
    description: '自定义 token 内容。作用域：`{ option, active }`。'
  - name: extra
    description: 放在列表流内的附加控件（All、Invert）。加 `ui-pick-quiet` 类即可获得 quiet action 皮肤；它们与选项一样参与行数测量和展开动画。
---

## 行为

Pick 用于从很多值里选多个：过滤器、标签集、可见列。token 是安静的文字；
选中时 accent 色块从左侧扫入垫在字下。作用在整个集合上的 quiet action
（All、Invert）不属于选择本身，组件不渲染它们：通过 `#extra` 插槽放你自己
的按钮并加 `ui-pick-quiet` 类（meta 字号的虚线下划线，action 的虚线折叠
成一条线），它们会落在同一个换行流里，也参与截断测量。Show all / Show
less 是同一套 quiet action。

列表换行超过 `rows` 行时截断到测量高度，并出现 Show all 控件。展开时高度
做过渡，被截掉的行随高度上升、淡入。
