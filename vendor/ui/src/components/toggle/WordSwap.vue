<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Show the `on` content instead of the `off` content. */
    on?: boolean
    offLabel?: string
    onLabel?: string
  }>(),
  {
    on: false,
    offLabel: '',
    onLabel: '',
  },
)
defineSlots<{
  off?: () => unknown
  on?: () => unknown
}>()

const offEl = ref<HTMLElement>()
const onEl = ref<HTMLElement>()
const width = ref(0)

function measure(): void {
  width.value = (props.on ? onEl.value : offEl.value)?.offsetWidth ?? 0
}

watch([() => props.on, () => props.offLabel, () => props.onLabel], () => nextTick(measure))

onMounted(async () => {
  measure()
  await document.fonts?.ready
  measure()
})
</script>

<template>
  <span
    class="ui-word-swap"
    :style="width ? { width: `${width}px` } : undefined"
  >
    <span
      ref="offEl"
      :class="{ 'is-on': !on }"
      :aria-hidden="on || undefined"
      ><slot name="off">{{ offLabel }}</slot></span
    >
    <span
      ref="onEl"
      :class="{ 'is-on': on }"
      :aria-hidden="!on || undefined"
      ><slot name="on">{{ onLabel }}</slot></span
    >
  </span>
</template>

<style scoped>
/* WordSwap: two contents in one cell, the hidden one rolls away like Toggle. */
.ui-word-swap {
  display: inline-grid;
  overflow: hidden;
  clip-path: inset(0 -0.3em);
  vertical-align: bottom;
  transition: width 0.55s var(--ui-ease);
}

.ui-word-swap > span {
  grid-area: 1 / 1;
  justify-self: start;
  white-space: nowrap;
  transition:
    translate 0.55s var(--ui-ease),
    opacity 0.4s var(--ui-ease);
}

.ui-word-swap :deep(svg) {
  display: block;
  width: 1em;
  height: 1em;
}

.ui-word-swap > span:first-child:not(.is-on) {
  translate: 0 -100%;
  opacity: 0;
}

.ui-word-swap > span:last-child:not(.is-on) {
  translate: 0 100%;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .ui-word-swap,
  .ui-word-swap > span {
    transition: none;
  }
}
</style>
