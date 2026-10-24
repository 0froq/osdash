---
title: FormField
designStatus: ai-draft
description: A label, description and error association for one form control.
props:
  - name: label
    type: string
    required: true
    description: Visible label and accessible control name.
  - name: id
    type: string
    description: Control ID; otherwise a stable Vue useId value is generated.
  - name: description
    type: string
    description: Optional help text associated through aria-describedby.
  - name: error
    type: string
    description: Consumer-provided error text; a nonempty value marks the control invalid.
  - name: required
    type: boolean
    default: "false"
    description: Visible required marker and native/ARIA required control props.
slots:
  - name: default
    description: Receives controlProps (FieldControlProps). Bind to the actual control.
---

FormField manages accessible association, not values or validation. It has no model. The default slot receives `controlProps`: `id`, `required`, `aria-labelledby`, `aria-describedby`, `aria-invalid` and `aria-required`. Bind these to a single real input or a component that forwards them to its actual control. The label's `for` points at that ID; description and error have distinct IDs. Any explicit `id` must be unique in the document.

The error is supplied by your own validation policy. It is not an automatic live announcement and FormField does not submit, reset, parse, or validate your data. The required attribute participates in native constraint validation only on controls that support it; ARIA does not implement validation. Native form reset and Vue state reset must be coordinated by the application.

Use the built-in label on TextInput/NumberInput for simple fields. Do not wrap them in FormField just to create a second visible label. For a grouped set of controls, use a native fieldset and legend rather than binding one ID to multiple controls. Native attributes on FormField itself go to its wrapper; pass control attributes inside the slot.

## Usage

```vue
<script setup lang="ts">
import { FormField } from '@froq/ui'
import { ref } from 'vue'
import '@froq/ui/style.css'

const title = ref('')
const error = ref<string>()
</script>

<template>
  <div class="ui">
    <FormField
      label="Title"
      description="Use a short, recognizable name."
      :error="error"
      required
    >
      <template #default="{ controlProps }">
        <input
          v-bind="controlProps"
          v-model="title"
          class="ui-field-control"
          type="text"
          name="title"
        >
      </template>
    </FormField>
  </div>
</template>
```

`FieldControlProps` is exported from `@froq/ui` and `@froq/ui/vue`.
