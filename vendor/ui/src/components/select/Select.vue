<script setup lang="ts">
import type { ChoiceOption } from '../../vue'
import { SelectContent, SelectIcon, SelectItem, SelectItemIndicator, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from 'reka-ui'
import { useId, useTemplateRef } from 'vue'
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  label: string
  options: ChoiceOption[]
  framed?: boolean
  native?: boolean
  hideLabel?: boolean
  accent?: string
  disabled?: boolean
  required?: boolean
  name?: string
  align?: 'start' | 'center' | 'end'
}>(), { native: true, align: 'start' })
defineSlots<{ option?: (scope: { option: ChoiceOption }) => unknown }>()

const model = defineModel<string>({ required: true })
const { wrapperAttrs, controlAttrs } = useControlAttrs()
const portal = useTemplateRef<HTMLElement>('portal')
const id = useId()

function preventRepeatedSelection(event: MouseEvent): void {
  if (event.detail > 1)
    event.preventDefault()
}
</script>

<template>
  <div
    v-bind="wrapperAttrs()"
    class="ui-field"
    :class="{ 'ui-select-custom': !native }"
    :style="accent ? { '--ui-accent': accent } : undefined"
  >
    <label
      v-if="!hideLabel"
      :for="String(controlAttrs().id ?? id)"
      class="ui-field-label"
    >{{ label }}</label>
    <span
      v-if="native"
      class="ui-select-control"
    >
      <select
        v-bind="controlAttrs()"
        :id="String(controlAttrs().id ?? id)"
        v-model="model"
        class="ui-field-control ui-select"
        :class="{ 'is-framed': framed }"
        :aria-label="hideLabel ? label : undefined"
        :disabled="disabled"
        :required="required"
        :name="name"
      >
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>
      <svg
        class="ui-select-chevron"
        viewBox="0 0 12 8"
        aria-hidden="true"
        focusable="false"
      >
        <path d="m1 1 5 5 5-5" />
      </svg>
    </span>
    <SelectRoot
      v-else
      v-model="model"
      :disabled="disabled"
      :required="required"
      :name="name"
    >
      <div
        ref="portal"
        class="ui-select-portal"
      />
      <SelectTrigger
        v-bind="controlAttrs()"
        :id="String(controlAttrs().id ?? id)"
        class="ui-select-trigger"
        :class="{ 'is-framed': framed }"
        :aria-label="label"
        @mousedown.capture="preventRepeatedSelection"
        @selectstart.prevent
        @dblclick.prevent.stop
      >
        <SelectValue>{{ options.find(option => option.value === model)?.label }}</SelectValue>
        <SelectIcon as-child>
          <svg
            viewBox="0 0 12 8"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m1 1 5 5 5-5" />
          </svg>
        </SelectIcon>
      </SelectTrigger>
      <SelectPortal
        :to="portal ?? undefined"
        :disabled="!portal"
      >
        <SelectContent
          class="ui-select-content"
          position="popper"
          :align="align"
          :side-offset="4"
          :collision-padding="12"
          :body-lock="false"
          @mousedown.capture="preventRepeatedSelection"
          @selectstart.prevent
          @dblclick.prevent.stop
        >
          <SelectViewport>
            <SelectItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
              :text-value="option.label"
              class="ui-select-item"
            >
              <SelectItemText>
                <slot
                  name="option"
                  :option="option"
                >
                  {{ option.label }}
                </slot>
              </SelectItemText>
              <SelectItemIndicator
                class="ui-select-indicator"
                aria-hidden="true"
              />
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>
