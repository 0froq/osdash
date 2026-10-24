<script setup lang="ts">
import type { StoryCell } from '~/utils/story'

defineProps<{ cells: StoryCell[]; focus: number | null }>()
</script>

<template>
  <span
    class="st-gutter"
    aria-hidden="true"
  >
    <span
      v-for="cell in cells"
      :key="cell.lane"
      class="st-cell"
      :class="{
        other: !cell.mine,
        primary: cell.primary,
        dashed: cell.dashed,
        fade: cell.fade,
        dim: focus !== null && focus !== cell.lane,
      }"
    >
      <i
        v-if="cell.up"
        class="st-up"
      />
      <i
        v-if="cell.down"
        class="st-down"
      />
      <i
        v-if="cell.hl"
        class="st-h st-hl"
        :class="[`to-${cell.link}`, { cross: cell.cross }]"
      />
      <i
        v-if="cell.hr"
        class="st-h st-hr"
        :class="[`to-${cell.link}`, { cross: cell.cross }]"
      />
      <i
        v-if="cell.node"
        class="st-node"
        :class="`n-${cell.node}`"
      >
        <template v-if="cell.node === 'stack' || cell.node === 'group'"><b /><b /><b /></template>
      </i>
    </span>
  </span>
</template>

<style scoped>
.st-gutter {
  display: flex;
}

.st-cell {
  position: relative;
  flex: none;
  width: var(--st-col);
  color: var(--st-ink);
  transition: opacity 220ms var(--ease);
}

.st-cell.other {
  color: var(--st-ink-other);
}

.st-cell.dim {
  opacity: 0.22;
}

.st-cell > i {
  position: absolute;
  display: block;
}

.st-up,
.st-down {
  left: calc(50% - var(--st-w) / 2);
  width: var(--st-w);
  background: currentColor;
}

.st-cell.primary {
  --st-w: 2px;
}

.st-up {
  top: 0;
  height: var(--st-y);
}

.st-down {
  top: var(--st-y);
  bottom: 0;
}

.st-cell.fade .st-up {
  background: linear-gradient(transparent, currentColor);
}

.st-cell.dashed .st-up,
.st-cell.dashed .st-down,
.row-now .st-cell.primary .st-down {
  background: repeating-linear-gradient(currentColor 0 3px, transparent 3px 7px);
}

.st-h {
  top: calc(var(--st-y) - 0.75px);
  height: 1.5px;
  background: currentColor;
}

.st-hl {
  left: 0;
  right: 50%;
}

.st-hr {
  left: 50%;
  right: 0;
}

.st-h.to-mine {
  color: var(--st-ink);
}

.st-h.to-other {
  color: var(--st-ink-other);
}

.st-h.to-good {
  color: var(--st-good);
}

/* A connector bridges over the rails it crosses. */
.st-h.cross {
  z-index: 1;
  box-shadow:
    0 -2.5px 0 var(--bg),
    0 2.5px 0 var(--bg);
}

/* Nodes */
.st-node {
  top: var(--st-y);
  left: 50%;
  z-index: 2;
  box-sizing: border-box;
  width: 7px;
  height: 7px;
  border: 1.5px solid transparent;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 2.5px var(--bg);
  transform: translate(-50%, -50%);
  transition:
    width 300ms var(--ease),
    height 300ms var(--ease),
    border-radius 300ms var(--ease),
    border-color 200ms var(--ease),
    background-color 200ms var(--ease);
}

.n-open {
  width: 9px;
  height: 9px;
  border-color: currentColor;
  background: var(--bg);
}

.n-minor {
  width: 5px;
  height: 5px;
  box-shadow: 0 0 0 2px var(--bg);
}

.n-merged {
  width: 9px;
  height: 9px;
  background: var(--st-good);
}

.n-join {
  width: 9px;
  height: 9px;
  border-color: var(--st-good);
  background: var(--bg);
}

.n-closed {
  width: 11px;
  height: 11px;
  background: var(--bg);
  box-shadow: none;
}

.n-closed::before,
.n-closed::after {
  content: '';
  position: absolute;
  top: calc(50% - 0.75px);
  left: 0;
  width: 100%;
  height: 1.5px;
  border-radius: 1px;
  background: currentColor;
  transform: rotate(45deg);
}

.n-closed::after {
  transform: rotate(-45deg);
}

/* Collapsed fold: a short stack of dots on the rail. Open: a ring that starts a bracket. */
.n-stack,
.n-group {
  width: 7px;
  height: 17px;
  border-radius: 4px;
  background: var(--bg);
  box-shadow: none;
}

.n-stack b,
.n-group b {
  position: absolute;
  left: 50%;
  width: 3.5px;
  height: 3.5px;
  border-radius: 50%;
  background: currentColor;
  transform: translate(-50%, -50%);
  transition:
    top 300ms var(--ease),
    opacity 200ms var(--ease);
}

.n-stack b:nth-child(1) {
  top: 18%;
}

.n-stack b:nth-child(2) {
  top: 50%;
}

.n-stack b:nth-child(3) {
  top: 82%;
}

.n-group {
  width: 9px;
  height: 9px;
  border-color: currentColor;
  border-radius: 50%;
  box-shadow: 0 0 0 2.5px var(--bg);
}

.n-group b {
  top: 50%;
  opacity: 0;
}

.n-now {
  width: 13px;
  height: 13px;
  border: 2px solid var(--muted);
  background: var(--bg);
  box-shadow: 0 0 0 3px var(--bg);
}

.n-now::before {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: var(--muted);
}

.turn-you .n-now {
  border-color: var(--accent);
}

.turn-you .n-now::before {
  background: var(--accent);
}

.turn-you .n-now::after {
  content: '';
  position: absolute;
  inset: -2px;
  border: 1.5px solid var(--accent);
  border-radius: 50%;
  animation: st-pulse 2.8s var(--ease) infinite;
}

.n-next {
  width: 7px;
  height: 7px;
  border-color: currentColor;
  background: var(--bg);
  opacity: 0.7;
}

@keyframes st-pulse {
  0% {
    opacity: 0.55;
    transform: scale(1);
  }

  70%,
  100% {
    opacity: 0;
    transform: scale(2.2);
  }
}
</style>
