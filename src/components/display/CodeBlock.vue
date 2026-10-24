<script setup lang="ts">
import type { CodeSpan } from '../../vue'
import { computed, useId, useTemplateRef, watch } from 'vue'
import { useDisclosure } from '../../vue'

const props = withDefaults(defineProps<{
  /** Visible title, usually a filename. A blank label draws no title row. */
  label?: string
  code?: string
  spans?: readonly CodeSpan[]
  /** Fold the source behind the title. A frame without a title cannot fold. */
  collapsible?: boolean
}>(), {
  label: '',
  collapsible: false,
})
defineSlots<{
  action?: () => unknown
  default?: () => unknown
}>()
const open = defineModel<boolean>('open', { default: false })
const titled = computed(() => props.label.trim().length > 0)
const foldable = computed(() => props.collapsible && titled.value)
const id = useId()
const triggerId = `${id}-trigger`
const panelId = `${id}-panel`
const panel = useTemplateRef<HTMLElement>('panel')
const { toggle } = useDisclosure(open)

watch(open, (value) => {
  if (!foldable.value || value || typeof document === 'undefined')
    return
  if (panel.value?.contains(document.activeElement))
    document.getElementById(triggerId)?.focus()
})
</script>

<template>
  <div
    class="ui-code-block"
    :class="{ 'is-titled': titled, 'is-collapsible': foldable, 'is-open': foldable && open }"
  >
    <header
      v-if="titled"
      class="ui-code-block-header"
    >
      <button
        v-if="foldable"
        :id="triggerId"
        type="button"
        class="ui-code-block-toggle"
        :aria-expanded="open"
        :aria-controls="panelId"
        @click="toggle"
      >
        <span
          class="ui-code-block-chevron"
          aria-hidden="true"
        />
        <span>{{ label }}</span>
      </button>
      <span v-else>{{ label }}</span>
      <div
        v-if="$slots.action"
        class="ui-code-block-action"
      >
        <slot name="action" />
      </div>
    </header>
    <div
      v-else-if="$slots.action"
      class="ui-code-block-action is-corner"
    >
      <slot name="action" />
    </div>
    <div
      :id="foldable ? panelId : undefined"
      ref="panel"
      class="ui-code-block-panel"
      :hidden="foldable && !open ? true : undefined"
      :inert="foldable && !open ? true : undefined"
      :aria-hidden="foldable && !open ? true : undefined"
    >
      <div class="ui-code-block-clip">
        <div class="ui-code-block-body">
          <slot>
            <pre class="ui-code-block-pre"><code><template v-if="spans"><span
              v-for="(span, index) in spans"
              :key="index"
              :style="span.color ? { color: span.color } : undefined"
            >{{ span.text }}</span></template><template v-else>{{ code }}</template></code></pre>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>
