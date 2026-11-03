<script setup lang="ts">
import type { ChoiceOption } from '../../vue'
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { useId, useTemplateRef } from 'vue'
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
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
  }>(),
  { native: true, align: 'start' },
)
defineSlots<{ option?: (scope: { option: ChoiceOption }) => unknown }>()

const model = defineModel<string>({ required: true })
const { wrapperAttrs, controlAttrs } = useControlAttrs()
const portal = useTemplateRef<HTMLElement>('portal')
const id = useId()

function preventRepeatedSelection(event: MouseEvent): void {
  if (event.detail > 1) event.preventDefault()
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
      >{{ label }}</label
    >
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

<style scoped>
.ui-field-control[aria-invalid='true'] {
  color: var(--ui-accent);
  border-bottom-color: var(--ui-accent);
}

/*Floating lists share one control-tier surface: hairline, square, no soft elevation.*/
.ui-select-content {
  box-sizing: border-box;
  z-index: 1001;
  min-width: min(9.5rem, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  max-height: calc(100dvh - 24px);
  padding: 4px 0;
  overflow-y: auto;
  border: 1px solid var(--ui-line);
  border-radius: 0;
  background: var(--ui-bg);
  box-shadow: none;
  color: var(--ui-fg);
  font: 11px/1.3 var(--ui-font-meta);
  outline: none;
}

.ui-select-control {
  position: relative;
  display: block;
  min-width: 0;
}

.ui-select {
  min-width: 0;
  padding-right: 34px;
}

.ui-select.is-framed {
  padding: 6px 34px 6px 8px;
  border: 1px solid var(--ui-line);
  font: inherit;
}

.ui-select.is-framed:focus {
  border-color: var(--ui-accent);
}

.ui-select-chevron {
  position: absolute;
  right: 12px;
  top: 50%;
  width: 10px;
  height: 7px;
  transform: translateY(-50%);
  fill: none;
  stroke: var(--ui-muted);
  stroke-width: 1.25;
  pointer-events: none;
}

.ui-select-custom {
  position: relative;
  font-family: var(--ui-font-meta);
  line-height: 1.3;
  -webkit-user-select: none;
  user-select: none;
}

.ui-select-portal {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  width: 0;
  height: 0;
}

.ui-select-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 28px;
  /*padding: 4px 8px;*/
  border: 0;
  background: transparent;
  color: var(--ui-fg);
  font: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--ui-dur) var(--ui-ease);
}

.ui-select-trigger.is-framed {
  border: 1px solid var(--ui-line);
}

.ui-select-trigger:hover,
.ui-select-trigger[data-state='open'] {
  color: var(--ui-accent);
}

.ui-select-trigger:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 2px;
}

.ui-select-trigger:disabled {
  opacity: 0.5;
  cursor: default;
}

.ui-select-trigger :deep(svg) {
  width: 10px;
  height: 7px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.25;
}

/*List chrome is shared with Menu in overlay.css. Rows are shared with Combobox.*/
.ui-select-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0;
  padding-block: 8px;
  padding-inline: 36px 16px;
  border-radius: 0;
  outline: none;
  cursor: default;
  user-select: none;
}

.ui-select-item[data-highlighted] {
  background: none;
  color: var(--ui-fg);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
}

.ui-select-item:focus-visible {
  outline: none;
}

.ui-select-item[data-state='checked'] {
  background: none;
  color: var(--ui-fg);
}

.ui-select-indicator {
  position: absolute;
  top: 50%;
  inset-inline-start: 16px;
  flex: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ui-accent);
  transform: translateY(-50%);
}

.ui-select-item[data-disabled] {
  opacity: 0.5;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .ui-select-trigger {
    transition: none;
  }
}

.ui-field {
  display: grid;
  gap: 8px;
  max-width: 20rem;
}

.ui-field-label {
  color: var(--ui-muted);
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ui-field-control {
  width: 100%;
  padding: 8px 0;
  border: 0;
  border-bottom: 1px solid var(--ui-line);
  border-radius: 0;
  appearance: none;
  background: none;
  color: var(--ui-fg);
  font: inherit;
  font-family: var(--ui-font-text);
  font-size: 16px;
}

.ui-field-control:focus {
  border-bottom-color: var(--ui-accent);
  outline: none;
}

.ui-field-control:disabled {
  color: var(--ui-muted);
  cursor: not-allowed;
}
</style>
