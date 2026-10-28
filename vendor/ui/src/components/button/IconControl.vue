<script setup lang="ts">
import { computed } from 'vue'
import Button from './Button.vue'

/**
 * One icon control. With `href` it is a link, without it a button, so callers
 * never have to pick between two near-identical components.
 */
const props = withDefaults(defineProps<{
  /** Accessible name. Rendered as `aria-label`, never as visible text. */
  label: string
  /** Renders an anchor to this URL. External links open in a new tab. */
  href?: string
  type?: 'button' | 'submit' | 'reset'
  /** Draw the hairline frame around the control. Turn it off for a bare glyph. */
  bordered?: boolean
  /** Keep the glyph in the accent colour, for a link that reads as the primary action. */
  accent?: boolean
}>(), { type: 'button', bordered: true, accent: false })

const external = computed(() => Boolean(props.href && /^[a-z]+:\/\//i.test(props.href)))
</script>

<template>
  <a
    v-if="href"
    class="ui-icon-control"
    :class="{ 'is-bordered': bordered, 'is-accent': accent }"
    :href="href"
    :aria-label="label"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noreferrer' : undefined"
  >
    <span
      class="ui-icon-control-glyph"
      aria-hidden="true"
    ><slot /></span>
  </a>
  <Button
    v-else
    class="ui-icon-control"
    :class="{ 'is-bordered': bordered, 'is-accent': accent }"
    :type="type"
    :aria-label="label"
  >
    <span
      class="ui-icon-control-glyph"
      aria-hidden="true"
    ><slot /></span>
  </Button>
</template>
