<script setup lang="ts">
import { useControlAttrs } from '../../vue'

defineOptions({ inheritAttrs: false })

defineProps<{
  label: string
}>()

const model = defineModel<boolean>({ default: false })
const { wrapperAttrs, controlAttrs } = useControlAttrs()
</script>

<template>
  <label
    v-bind="wrapperAttrs()"
    class="ui-check"
  >
    <input
      v-bind="controlAttrs()"
      v-model="model"
      type="checkbox"
      class="ui-check-input"
    />
    <span
      class="ui-check-mark"
      aria-hidden="true"
    />
    <span>{{ label }}</span>
  </label>
</template>

<style scoped>
.ui-check {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  color: var(--ui-fg);
  cursor: pointer;
  font-family: var(--ui-font-text);
  font-size: 15px;
  line-height: 1.4;
}

.ui-check-input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.ui-check-mark {
  display: grid;
  flex: none;
  width: 14px;
  height: 14px;
  place-items: center;
  border: 1px solid var(--ui-fg);
  border-radius: var(--ui-radius);
}

.ui-check-mark::after {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ui-accent);
  content: '';
  opacity: 0;
}

.ui-check-input:checked + .ui-check-mark::after {
  opacity: 1;
}

.ui-check-input:focus-visible + .ui-check-mark {
  outline: 1px solid var(--ui-accent);
  outline-offset: 3px;
}

.ui-check:has(.ui-check-input:disabled) {
  color: var(--ui-muted);
  cursor: not-allowed;
}

.ui-check-input:disabled + .ui-check-mark {
  border-color: var(--ui-muted);
}
</style>
