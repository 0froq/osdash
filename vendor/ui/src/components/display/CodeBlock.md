---
title: CodeBlock
designStatus: ai-draft
description: A bordered source frame with a title and an optional corner action.
props:
  - name: label
    type: string
    description: Visible title, usually a filename. A blank label draws no title row.
  - name: code
    type: string
    description: Plain source rendered when neither spans nor the default slot is set.
  - name: spans
    type: CodeSpan[]
    description: Source pieces. A span may carry its own color. Ignored when the default slot is set.
  - name: collapsible
    type: boolean
    default: "false"
    description: Fold the source behind the title. A frame without a title cannot fold. Starts closed.
model:
  name: open
  type: boolean
  default: "false"
  description: Whether a collapsible frame is open. Ignored when collapsible is false.
slots:
  - name: action
    description: Optional action, such as a copy button or a link. With a title it sits in the title row. Without one it floats over the top corner of the source. Omit it to leave the corner empty.
  - name: default
    description: Replaces the source area. Use this for highlighted source the component should not own, or for content that is not a source listing.
---

CodeBlock is the frame around a source listing: a surface, an optional title, and a corner. It does not copy, route, or highlight. Put a `CopyButton` in the `action` slot when the listing should be copied, a link when the corner leads somewhere else, or nothing when the corner should stay empty.

`code` prints plain text. `spans` prints the same text in pieces, and each piece may set `color` so the caller can apply its own palette. The default slot replaces that listing entirely. Syntax inspection, terminal output, and translation stay with the caller.

Set `collapsible` to fold the source. The frame starts closed and shows only the title and the corner. The title toggles it; the corner does not. `v-model:open` controls that state. A blank label cannot fold, because the closed frame would have nothing to name it. Closed, the frame keeps a short vertical padding so it reads as one row, and the rule under the title stays hidden. Open, the padding returns to the usual frame, the rule fades in, and the source sits 14px below it. The title does not move as the frame opens. Open, the title pins to the top of the screen while the frame is in view, and the source fades out beneath it; no ancestor may clip it with `overflow: hidden`, `auto`, or `scroll`, and a host with a fixed bar overrides `top` on `.ui-code-block-header`. The height and padding move together. Reduced motion skips the transition.

A titled frame, folded or not, draws a rule under its title. A frame without a title has no title row: its action floats over the top right of the source, so a long first line can run under it.

Import `@froq/ui/style.css` and place it inside `.ui`. Override `--ui-bg`, `--ui-fg`, `--ui-muted`, `--ui-line`, and `--ui-accent` on the component when the frame should show a palette other than the surrounding page.

## Usage

```vue
<script setup lang="ts">
import { CodeBlock, CopyButton } from '@froq/ui'
import '@froq/ui/style.css'

const source = 'print("hello")'
</script>

<template>
  <div class="ui">
    <CodeBlock
      label="hello.lua"
      :code="source"
    >
      <template #action>
        <CopyButton
          :text="source"
          label="Copy"
          copied-label="Copied"
          error-label="Copy failed"
        />
      </template>
    </CodeBlock>
  </div>
</template>
```
