<script setup lang="ts">
/**
 * The GitHub glyph for what a card is: a pull request or an issue. It also
 * carries the unread mark, so one glyph says both "this is a PR" and "nobody
 * has read it yet".
 */
withDefaults(
  defineProps<{
    kind: 'pr' | 'issue'
    /** Draws the glyph in the accent colour and marks the card unread. */
    unread?: boolean
    /** Height in `cap` units, so the glyph matches any font size beside it. */
    scale?: number
  }>(),
  { unread: false, scale: 1 },
)
</script>

<template>
  <span
    class="kind-icon"
    :class="[`is-${kind}`, { 'is-unread': unread }]"
    :style="{ '--kind-scale': scale }"
    aria-hidden="true"
  >
    <svg
      class="kind-glyph"
      viewBox="0 0 16 16"
      fill="currentColor"
      focusable="false"
    >
      <!-- Pull request: two nodes joined by a branch -->
      <path
        v-if="kind === 'pr'"
        d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"
      />
      <!-- Issue: the dot GitHub draws for an open issue -->
      <path
        v-else
        d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"
      />
    </svg>
  </span>
</template>

<style scoped>
.kind-icon {
  position: relative;
  display: inline-flex;
  flex: none;
  /* Sized in cap units so the glyph keeps the same optical height at any font
     size it sits next to. */
  width: calc(var(--kind-scale, 1) * 1.15cap);
  height: calc(var(--kind-scale, 1) * 1.15cap);
  /* A shade deeper than the number it labels, so the shape reads first. */
  color: color-mix(in oklab, currentColor 70%, var(--fg));
  vertical-align: -0.125em;
}

.kind-glyph {
  width: 100%;
  height: 100%;
}

/* Unread keeps the glyph in the text colour and adds a green dot. */
.kind-icon.is-unread {
  color: var(--fg);
}

.kind-icon.is-unread::after {
  content: '';
  position: absolute;
  top: -0.15cap;
  right: -0.35cap;
  width: 0.45cap;
  height: 0.45cap;
  border-radius: 50%;
  background: var(--news);
}
</style>
