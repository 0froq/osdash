---
title: Paper
designStatus: ai-draft
description: Fibre on a light sheet, specks on a dark one. Either side can be left off.
props:
  - name: light
    type: boolean
    default: "true"
    description: Draw the fibre while the page is light.
  - name: dark
    type: boolean
    default: "true"
    description: Draw the specks while the page is dark.
slots:
  - name: default
    description: Content above the texture.
---

Paper lays a sheet texture inside whatever it wraps. Light pages get the fibre. Dark pages get the speck field. Set `light` or `dark` to `false` to leave that side flat. The texture follows the page theme (`data-theme`, or a `dark` class on the document).

## Usage

```vue
<script setup lang="ts">
import { Paper } from '@froq/ui'
</script>

<template>
  <Paper class="ui">
    <p>Held on the sheet.</p>
  </Paper>
</template>
```

## Page ink and handwriting

The framework-free `@froq/ui/core` entry also exports `createInkWash`, `createPenStroke`, `layoutHandwriting`, `signatureEllipse` and `createPaperPaint`. `usePaperSignature` from `@froq/ui/vue` coordinates one page's wash and pen: it waits for fonts and DOM settling, starts the wash after 250 ms and the pen after 900 ms, and destroys observers, animation frames, probes, canvases and timers on unmount. It does not add document classes or own application content.

`usePaperSignature(root, options)` accepts:

- `root`: a ref to a positioned page element with its own stacking context (for example `position: relative; z-index: 0`). The pen is prepended inside it at z-index -1. Do not clip that canvas: it covers the viewport's document slice.
- `anchors()`: caller-owned elements: optional `mark`, `rule`, `hand`, `handText`, `finalMark`, `finalSection`, `finalBand`, `margin`, and `sections` entries containing `element`, `label`, optional `price`. The route lifts between sections below 860 px. Anchors are read again after a real content resize.
- `colors()`: resolved six-digit HEX `{ paper, ink, accent, dark }`; derive these from the host's token palette. The core engine takes resolved data, not CSS variables.
- `mixColors(first, weight, second)`: the host's existing mixer; weight is the first color's share. LiG passes its OKLab mixer so extraction does not change ink tones.
- `settings()`: optional `paper`, `bloom`, `line`, `hand` (default true), `dwellAfter` (seconds, default 0), and `click` (default false). Settings are read once after layout settles. Remount to change them.
- `animate` (default true) draws the ink over time. Off paints the finished stroke. Reduced motion also paints it finished.
- `marks()` returns free-standing Latin marks (`text`, plus an `element` or a document `box`). The pen lifts before each one, so a mark is not part of the page route. Letters outside the hand font advance by a space and leave no stroke. Omit `marks` and the route is unchanged.
- `tremor`, `roundJoins`, and `fadeRoute` default to true. `continuePastHand` defaults to true; off leaves a tagline as its own ink. `labels` is `ring` or `line` (default `ring`).

It returns readonly `state` (`paper`, `bloom`, `stroke`, `hand`) and `setColors(colors?)`. Apply layout-changing state synchronously (for example, an imperative `watch(signature.state, applyFallbackClasses, { flush: 'sync' })`) before pen measurement; a deferred template class update can move handwriting after measurement. Hide typeset handwriting, rules and punctuation only when the corresponding state is active; text remains in the DOM for accessibility and fallback. Call `setColors()` after the host theme updates. A failed WebGL2 context keeps the wash inactive; a failed 2D context keeps the pen inactive. Reduced motion draws the completed route and settles washes without continuous growth.

The wash owns a **page-level** canvas under the body, not a local component background. Mount one coordinator per page. Keep layers above that canvas transparent where the wash should show, and account for page transitions in the host. `Paper`'s opaque background is appropriate for local texture; it can cover the body wash. LiG keeps a page-specific texture wrapper and reuses `createPaperPaint`.

```ts
import { usePaperSignature } from '@froq/ui/vue'

// Page code supplies its own refs, palette mixer, anchors and theme watcher.
const signature = usePaperSignature(page, {
  colors: readResolvedPalette,
  mixColors: mixPaletteColors,
  anchors: () => ({
    mark: firstStop.value,
    hand: tagline.value,
    handText: taglineCopy,
    rule: rule.value,
    sections: sectionAnchors,
    finalMark: lastStop.value,
    finalSection: lastSection.value,
    margin: firstLabel.value,
  }),
})
watch(theme, async () => {
  await nextTick()
  signature.setColors()
})
```

### Mobile stability

Both engines share a bounded, document-anchored canvas slice with 160 px overscan and a quantized origin. Assigning bitmap dimensions only when they change avoids clearing unchanged canvases. Browser toolbar height changes update the slice, not the pen route. A ResizeObserver rebuilds the route only when the page's content dimensions change, retaining segment progress and completed strokes. Avoid replacing stable viewport units in the host's layout with changing viewport-height units.

No UI automation verifies this contract. Manually check fast bidirectional scrolling, browser toolbar changes, rotation, theme changes while writing, final wash arrival, reduced motion, unavailable contexts and unmount during delayed start. EMS Allure stroke data and its SIL OFL notice ship in `core/signature`.
