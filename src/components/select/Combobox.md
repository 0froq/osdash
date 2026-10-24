---
title: Combobox
designStatus: ai-draft
description: A searchable, non-freeform selection field with single or multiple values.
model:
  type: string | string[]
  default: "''"
  description: Selected option identifier; use a string in single mode and an array in multiple mode.
props:
  - name: label
    type: string
    required: true
    description: Visible label for the input.
  - name: options
    type: ChoiceOption[]
    required: true
    description: Options with unique, non-empty values, labels, and optional disabled state.
  - name: toggleLabel
    type: string
    required: true
    description: Accessible name for the button that opens or closes the list.
  - name: clearLabel
    type: string
    required: true
    description: Accessible name for the button that clears the query and selection.
  - name: emptyLabel
    type: string
    required: true
    description: Fallback text shown when no options match.
  - name: placeholder
    type: string
    description: Placeholder for the text input.
  - name: multiple
    type: boolean
    default: "false"
    description: Allow selection of multiple options.
  - name: disabled
    type: boolean
    default: "false"
    description: Disable the input and selection controls.
  - name: ignoreFilter
    type: boolean
    default: "false"
    description: Skip local option filtering; the consumer manages remote filtering and request races.
  - name: name
    type: string
    description: Form submission name for the selected option identifier or identifiers, not the query text.
  - name: dir
    type: "'ltr' | 'rtl'"
    description: Text and interaction direction; defaults to the Reka UI direction context, then ltr.
  - name: portalTo
    type: "string | HTMLElement"
    description: Teleport target. Defaults to the nearest ancestor with class ui; without one, content renders inline on the client.
slots:
  - name: option
    description: Receives option and selected to customize option content.
  - name: empty
    description: Replaces the empty-result text.
---

Combobox selects from the supplied options; it is not a freeform text field. `v-model` contains the selected option identifier as a string in single mode or an array in multiple mode. The model defaults to an empty string. In multiple mode, the component presents that empty string as no selected values; the parent model is not rewritten until a selection or clear action changes it. Keep option values unique and non-empty. Unknown selected identifiers are not removed or corrected; their value is used as a fallback label.

A narrow TypeScript single-value model must include `''` to represent clearing, for example `ref<'' | 'vue' | 'react'>('vue')`. Multiple-value models use arrays. Keep option identifiers compatible with the consumer's model; the generic does not validate remote data or force the model shape to follow `multiple`.

`v-model:search` controls the input's current text. It is not just a record of user-entered query text: Reka UI may reset it after an option is selected or the input loses focus, and in single mode it can display the selected option's label. Typing or deleting input text alone does not change or clear the selected value. Use the clear button, named by `clearLabel`, to clear both query and selection. Clearing focuses the input before the clear button becomes disabled, and closes the option list. In multiple mode, selected values appear as read-only chips; change them through the option list or clear the whole selection.

`v-model:open` controls whether the option list is open. Set `ignoreFilter` when the consumer supplies already filtered or remote options; the consumer is responsible for request ordering and stale-response races. The `option` slot receives `{ option, selected }`; the `empty` slot replaces the fallback empty text.

The `name` prop submits the selected identifier(s), not the search text. Undeclared native attributes are applied to the input; `class` and `style` are applied to the outer field wrapper. An `id` passed as an undeclared attribute is overwritten by the component's generated input ID, which is linked to the visible label. A native `required` attribute validates that the search input contains text, not that an option is selected. Use `Select`, `RadioGroup`, or consumer-owned validation when selection-required validation is needed.

By default, the option list is teleported to the nearest consumer ancestor with class `.ui`; without one, it renders inline on the client. Import `style.css` and provide the `.ui` scope. A custom `portalTo` target must exist and provide the consumer's theme and UI tokens.

Form submission through `name` requires the component to be inside a form. Single selection submits `name=value`; multiple selection submits indexed fields such as `name[0]=value`, and an empty array contributes no selected fields. An input `form` attribute does not associate the hidden selection fields with an external form. Native form reset does not synchronize the Vue models; the consumer must reset them too. A forwarded `readonly` attribute only prevents text editing; it does not lock option selection. Use `disabled` to prevent all interaction. Clearing selection also closes the popup.

## Usage

```vue
<script setup lang="ts">
import { Combobox } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const country = ref('ca')
const search = ref('')
const open = ref(false)
const countries = [
  { value: 'ca', label: 'Canada' },
  { value: 'jp', label: 'Japan' },
  { value: 'nz', label: 'New Zealand', disabled: true },
]
</script>

<template>
  <div class="ui">
    <Combobox
      v-model="country"
      v-model:search="search"
      v-model:open="open"
      :options="countries"
      label="Country"
      toggle-label="Toggle country options"
      clear-label="Clear country selection"
      empty-label="No matching countries"
      placeholder="Search countries"
      name="country"
    >
      <template #option="{ option, selected }">
        {{ selected ? '✓ ' : '' }}{{ option.label }}
      </template>
      <template #empty>
        No matching countries
      </template>
    </Combobox>
  </div>
</template>
```
