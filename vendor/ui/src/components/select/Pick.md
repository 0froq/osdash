---
title: Pick
designStatus: reviewed
description: A wrapping multi-select token group for filters, with an optional row cap.
model:
  type: string[]
  default: '[]'
  description: Selected option values. Supports v-model.
props:
  - name: label
    type: string
    required: true
    description: Visible field label, also labels the group for assistive tech.
  - name: options
    type: PickOption[]
    required: true
    description: Tokens to pick from. Each may carry a trailing `count`.
  - name: rows
    type: number
    default: '2'
    description: Rows shown before the list truncates behind Show all. 0 shows everything.
  - name: moreLabel
    type: string
    default: "'Show all'"
    description: Text of the expand control shown when the list overflows.
  - name: lessLabel
    type: string
    default: "'Show less'"
    description: Text of the collapse control shown while expanded.
  - name: dir
    type: "'ltr' | 'rtl'"
    default: "'ltr'"
    description: Reading direction for roving focus.
  - name: loop
    type: boolean
    default: 'true'
    description: Whether focus wraps around the token list.
  - name: disabled
    type: boolean
    default: 'false'
    description: Disable the whole group.
slots:
  - name: option
    description: 'Custom token content. Scope: `{ option, active }`.'
  - name: extra
    description: Extra controls placed in the list flow (All, Invert). Give them the `ui-pick-quiet` class for the quiet-action skin; they are measured like options so the row cap and reveal motion cover them.
---

## Behavior

Pick is for choosing many values out of many — filters, tag sets, visible
columns. Tokens are quiet words; a picked one draws an accent wash in from the
left under the word. Quiet actions that act on the set as a whole (All, Invert)
do not belong in the selection, so the component does not render them: put them
in the `#extra` slot as your own buttons with the `ui-pick-quiet` class (a
mini dashed underline, the action dash collapsed into a rule) and they sit in
the same wrapping flow. Show all / Show less is the same quiet action.

When the list wraps past `rows` rows it truncates to a measured height and a
Show all control appears. Opening animates the height while the hidden rows
rise and fade in with it.
