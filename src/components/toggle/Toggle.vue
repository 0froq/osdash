<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  onLabel?: string
  offLabel?: string
  disabled?: boolean
}>(), {
  onLabel: 'on',
  offLabel: 'off',
  disabled: false,
})
const model = defineModel<boolean>({ default: false })

const off = ref<HTMLElement>()
const on = ref<HTMLElement>()
const width = ref(0)

function measure(): void {
  width.value = (model.value ? on.value : off.value)?.offsetWidth ?? 0
}

watch([model, () => props.onLabel, () => props.offLabel], () => nextTick(measure))

onMounted(async () => {
  measure()
  await document.fonts?.ready
  measure()
})
</script>

<template>
  <button
    type="button"
    role="switch"
    class="ui-toggle"
    :style="width ? { width: `${width}px` } : undefined"
    :aria-checked="model"
    :aria-label="label"
    :disabled="disabled"
    @click="!disabled && (model = !model)"
  >
    <span
      ref="off"
      :class="{ 'is-on': !model }"
    >{{ offLabel }}</span>
    <span
      ref="on"
      :class="{ 'is-on': model }"
    >{{ onLabel }}</span>
  </button>
</template>
