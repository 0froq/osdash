---
title: RadioGroup
designStatus: ai-draft
description: A native fieldset of labeled radio inputs with form support.
model:
  type: string | undefined
  description: The selected option value, or undefined when no option is selected.
props:
  - name: label
    type: string
    required: true
    description: Legend text naming the radio group.
  - name: options
    type: "ChoiceOption<T>[]"
    required: true
    description: Options with values, labels, and optional disabled state.
  - name: name
    type: string
    description: Native submission key. If omitted or empty, a unique generated name is used.
  - name: disabled
    type: boolean
    default: "false"
    description: Disable the fieldset and all its radio inputs.
  - name: required
    type: boolean
    default: "false"
    description: Apply the native required constraint to the radio group.
  - name: form
    type: string
    description: ID of the HTML form to associate each radio input with.
---

RadioGroup renders a native `<fieldset>` and `<legend>` containing labeled radio inputs. The model is optional and has no default; it holds the selected string value or `undefined`. The browser supplies native radio selection, keyboard behavior, and form constraint handling. An option with `disabled: true` becomes a disabled radio input. An invalid model value or a value for a disabled option is not corrected automatically.

The `name` is the actual native form submission key. If it is omitted or empty, RadioGroup uses a Vue-generated unique name; for meaningful form data, provide an explicit name. Separate groups in the same form should not reuse a name. Set `required` to enable the browser's native group constraint: selecting any enabled radio satisfies it. Use `form` to associate inputs with an HTML form by ID when they are not nested inside that form.

Undeclared attributes are applied to the root fieldset, not to each input. The root `id` belongs to the fieldset; each input is associated with its text through a wrapping native label, so callers do not need to provide input IDs. The component has no custom slots or events. Resetting the native form does not update the Vue model; the consumer must reset its state as well.

Unlike `Choice` and `ChoiceCircle`, which are custom button radio controls without native form values or required validation, RadioGroup provides native radio inputs and form behavior. It does not automatically migrate or replace the APIs of those components.

## Usage

```vue
<script setup lang="ts">
import { RadioGroup } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const visibility = ref<string | undefined>()
const options = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'team', label: 'Team', disabled: true },
]
</script>

<template>
  <div class="ui">
    <form id="profile-form">
      <RadioGroup
        v-model="visibility"
        :options="options"
        label="Visibility"
        name="visibility"
        required
        form="profile-form"
      />
    </form>
  </div>
</template>
```
