<script setup lang="ts">
import type { UnitBeat } from '#shared/unit'
import { relativeAge } from '~/utils/time'

const { t } = useI18n()

/**
 * A slice of the preview rail, drawn at card scale. It borrows the preview's
 * node vocabulary (`dot`, `open`, `minor`) and its paper-backed nodes, so a
 * card and the panel it opens read as the same object.
 */
const props = defineProps<{ beats: UnitBeat[] }>()

function when(at: string): string {
  return relativeAge(t, Date.now() - Date.parse(at))
}

const last = computed(() => props.beats.length - 1)
</script>

<template>
  <span
    v-if="beats.length"
    class="beat-rail"
  >
    <span
      v-for="(beat, index) in beats"
      :key="beat.at + beat.what"
      class="rail-row"
      :class="{ 'is-wants': beat.wants, 'is-last': index === last }"
    >
      <span
        class="rail-cell"
        aria-hidden="true"
      >
        <i class="rail-up" />
        <i
          v-if="index < last"
          class="rail-down"
        />
        <i
          class="rail-node"
          :class="`n-${beat.node}`"
        />
      </span>
      <span class="rail-body">
        <span class="rail-meta"
          ><span class="rail-when">{{ when(beat.at) }}</span
          ><span class="rail-actor">{{ beat.actor }}</span></span
        >
        <span class="rail-what">{{ beat.what }}</span>
      </span>
    </span>
  </span>
</template>

<style scoped>
.beat-rail {
  --rail-col: 13px;
  --rail-w: 1.5px;
  --rail-ink: color-mix(in oklab, var(--fg) 26%, transparent);
  display: grid;
  align-content: start;
  min-width: 0;
}

.rail-row {
  display: grid;
  grid-template-columns: var(--rail-col) minmax(0, 1fr);
  column-gap: 11px;
  min-width: 0;
}

.rail-cell {
  position: relative;
  color: var(--rail-ink);
}

.rail-cell > i {
  position: absolute;
  display: block;
}

/* The rail hangs from the node: the first row opens upward, the last closes. */
.rail-up,
.rail-down {
  left: calc(50% - var(--rail-w) / 2);
  width: var(--rail-w);
  background: currentColor;
}

.rail-up {
  top: 0;
  height: 8px;
}

.rail-down {
  top: 8px;
  bottom: 0;
}

.rail-node {
  top: 8px;
  left: 50%;
  z-index: 2;
  box-sizing: border-box;
  width: 6px;
  height: 6px;
  border: 1.5px solid transparent;
  border-radius: 50%;
  /* Paper under the ink, so a translucent rail never shows through the dot. */
  background: var(--bg);
  box-shadow: 0 0 0 2px var(--bg);
  transform: translate(-50%, -50%);
}

.rail-node.n-dot {
  border: 0;
}

.rail-node.n-dot::after {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--fg);
  content: '';
}

.rail-node.n-open {
  width: 8px;
  height: 8px;
  border-color: var(--fg);
}

.rail-node.n-minor {
  width: 4px;
  height: 4px;
  border: 0;
  background: var(--fg);
}

.rail-row.is-wants .rail-cell {
  color: var(--accent);
}

.rail-row.is-wants .rail-node.n-dot::after,
.rail-row.is-wants .rail-node.n-minor {
  background: var(--accent);
}

.rail-row.is-wants .rail-node.n-open {
  border-color: var(--accent);
}

.rail-body {
  min-width: 0;
  padding-bottom: 9px;
}

.rail-row.is-last .rail-body {
  padding-bottom: 0;
}

.rail-meta {
  display: flex;
  gap: 7px;
  align-items: baseline;
  min-width: 0;
  color: var(--muted);
  font-size: 10.5px;
  line-height: 1.4;
}

.rail-when {
  flex: none;
  color: var(--faint);
  font-family: var(--font-meta);
  font-size: 9.5px;
  font-variant-numeric: tabular-nums;
}

.rail-actor {
  min-width: 0;
  overflow: hidden;
  color: var(--fg);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rail-what {
  display: block;
  min-width: 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.rail-row.is-wants .rail-what {
  color: var(--accent);
}
</style>
