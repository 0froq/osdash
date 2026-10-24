---
title: UiDevtools
designStatus: ai-draft
description: A development overlay that shows which components come from the library and which the project wrote itself.
props:
  - name: library
    type: RegExp
    description: Files matching this pattern count as library components. Defaults to paths containing vendor/ui or node_modules/@froq/ui.
  - name: ignore
    type: RegExp
    description: Files matching this pattern are skipped. Defaults to other node_modules, .nuxt and the devtools itself.
---

UiDevtools adds a small `ui` button to the bottom right. It opens a panel that lists every single file
component on the page in two groups: the ones that are not in the library yet, and the ones that come from it.
The first list shows what could move into the library next. Each row has the component name, its file path and
how many instances are on the page.

Three switches control the page. Library and Project draw an outline and a name tag around each rendered
component: a solid accent outline for library components, a dashed outline for the project's own. Pages adds
route pages, layouts and `app.vue` to the lists, which are hidden by default because they are layout, not
reusable components. Pointing at a row outlines that component on the page, and clicking it scrolls the first
instance into view.

The component walks the running app's component tree and reads each component's `__file`. Vue only sets it in
development builds, so UiDevtools renders nothing in production and nothing needs to be removed before a
release. It cannot see components without a rendered root element, and it needs `vendor/ui` in the path to
recognise library files. Pass `library` for another layout. Strings in the panel are English and are not
localised. Place it inside an element with `class="ui"`.

## Usage

```vue
<script setup lang="ts">
import { UiDevtools } from '@froq/ui'
import '@froq/ui/style.css'
</script>

<template>
  <div class="ui">
    <UiDevtools />
  </div>
</template>
```
