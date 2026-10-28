---
title: IconControl
designStatus: ai-draft
description: A square icon control that renders as a button, or as a link when given a URL.
props:
  - name: label
    type: string
    required: true
    description: Accessible name applied as aria-label. Never rendered as visible text.
  - name: href
    type: string
    description: Renders an anchor instead of a button. Absolute URLs open in a new tab with rel=noreferrer.
  - name: type
    type: "'button' | 'submit' | 'reset'"
    default: button
    description: Native button type. Ignored when href is set.
  - name: bordered
    type: boolean
    default: "true"
    description: Draw the hairline frame. Turn it off for a bare glyph that only frames on hover.
  - name: accent
    type: boolean
    default: "false"
    description: Keep the glyph in the accent colour, for a link that reads as the primary action.
slots:
  - name: default
    description: Decorative icon content; rendered inside an aria-hidden wrapper.
---

IconControl is one square control that is either a button or a link. Passing `href` renders an `<a>`; leaving it out renders a `<button>`. One component covers both because the icon, the frame, the size and the hover are identical, and splitting them would only move the choice into the import list.

The `label` prop is always the accessible name and is never shown. The default slot takes icon artwork only: it sits inside an `aria-hidden` wrapper, so it must not contain text that carries meaning or any interactive descendant. Undeclared native attributes and listeners reach whichever element is rendered.

An absolute `href` opens in a new tab and gets `rel="noreferrer"`. A relative `href` stays in place, so in-app links keep normal navigation. For a toggle, pass `aria-pressed` from the consuming component; IconControl does not manage pressed state.

`bordered` defaults to true. A bare control keeps its 32px hit area but only shows the frame on hover. `accent` tints the glyph and, on hover, the frame, which is useful when the link is the row's primary action.

## Usage

```vue
<script setup lang="ts">
import { IconControl } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <IconControl
      label="Star this card"
      :aria-pressed="false"
      :bordered="false"
      @click="console.info('starred')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 3.6 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z" />
      </svg>
    </IconControl>

    <IconControl
      label="Open on GitHub"
      href="https://github.com/0froq/osdash"
      accent
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.88 2.34.67.07-.52.28-.88.51-1.08-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
    </IconControl>
  </div>
</template>
```
