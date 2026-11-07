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
        current: cell.node === 'now',
        on: focus === cell.lane,
        dim: focus !== null && focus !== cell.lane,
      }"
    >
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
  height: 100%;
}

.st-cell {
  position: relative;
  flex: none;
  width: var(--st-col);
  height: 100%;
  color: var(--st-ink);
  transition: color 220ms var(--ease);
}

.st-cell.other {
  color: var(--st-ink-other);
}

.st-cell.on {
  color: var(--fg);
}

/* Dim the ink only. Opacity would fade the paper too, and the rail shows through the node. */
.st-cell.dim {
  color: color-mix(in oklab, var(--st-ink) 22%, transparent);
}

.st-cell.other.dim {
  color: color-mix(in oklab, var(--st-ink-other) 22%, transparent);
}

.st-cell > i {
  position: absolute;
  display: block;
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
  /* Paper under the ink: a translucent fill alone lets the rail show through
     the dot, which reads as a darker stripe inside it. */
  background: var(--st-paper, var(--bg));
  box-shadow: 0 0 0 2.5px var(--st-paper, var(--bg));
  transform: translate(-50%, -50%);
  transition:
    width 300ms var(--ease),
    height 300ms var(--ease),
    border-radius 300ms var(--ease),
    border-color 200ms var(--ease),
    background-color 200ms var(--ease),
    color var(--dur-2) var(--ease);
}

/* A filled dot keeps an opaque paper base and paints its ink as a solid inner
   disc, so a translucent rail can never show through the middle. */
.n-dot {
  border: 0;
  background: var(--st-paper, var(--bg));
}

.n-open {
  border-color: currentColor;
  background: var(--st-paper, var(--bg));
}

.n-dot::after,
.n-open::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: currentColor;
  transform-origin: center;
  transition:
    transform 300ms var(--ease),
    opacity 200ms var(--ease);
}

/* Same move as a group opening: the solid disc eases away and the ring is left. */
.n-open::after {
  opacity: 0;
  transform: scale(0.45);
}

.n-minor {
  width: 5px;
  height: 5px;
  border: 0;
  background: var(--st-paper, var(--bg));
  box-shadow: 0 0 0 2.5px var(--st-paper, var(--bg));
}

.n-minor::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: currentColor;
}

.n-merged {
  width: 9px;
  height: 9px;
  border: 0;
  background: var(--st-good);
}

.st-cell.dim .n-merged {
  background: color-mix(in oklab, var(--st-good) 22%, var(--st-paper, var(--bg)));
}

.n-join {
  width: 9px;
  height: 9px;
  border-color: var(--st-good);
  background: var(--st-paper, var(--bg));
}

.st-cell.dim .n-join {
  border-color: color-mix(in oklab, var(--st-good) 22%, transparent);
}

.n-closed {
  width: 11px;
  height: 11px;
  background: var(--st-paper, var(--bg));
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
  background: var(--st-paper, var(--bg));
  box-shadow: none;
}

/* Paper past the stack, so the hover spread stays off the rail ends. */
.n-stack {
  box-shadow:
    0 -3px 0 var(--st-paper, var(--bg)),
    0 3px 0 var(--st-paper, var(--bg));
}

.n-stack {
  color: color-mix(in oklab, var(--fg) 55%, transparent);
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
  top: 14%;
}

.n-stack b:nth-child(2) {
  top: 50%;
}

.n-stack b:nth-child(3) {
  top: 86%;
}

.n-group {
  width: 9px;
  height: 9px;
  border-color: currentColor;
  border-radius: 50%;
  box-shadow: 0 0 0 2.5px var(--st-paper, var(--bg));
}

.n-group b {
  top: 50%;
  opacity: 0;
}

.n-now {
  width: 13px;
  height: 13px;
  border: 2px solid var(--muted);
  background: var(--st-paper, var(--bg));
  box-shadow: 0 0 0 3px var(--st-paper, var(--bg));
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

.st-cell.dim .n-now {
  border-color: color-mix(in oklab, var(--muted) 22%, transparent);
}

.st-cell.dim .n-now::before {
  background: color-mix(in oklab, var(--muted) 22%, transparent);
}

.turn-you .st-cell.dim .n-now {
  border-color: color-mix(in oklab, var(--accent) 22%, transparent);
}

.turn-you .st-cell.dim .n-now::before {
  background: color-mix(in oklab, var(--accent) 22%, transparent);
}

/*.turn-you .n-now::after {
  content: '';
  position: absolute;
  inset: -2px;
  border: 1.5px solid var(--accent);
  border-radius: 50%;
  animation: st-pulse 2.8s var(--ease) infinite;
}*/

/*@keyframes st-pulse {
  0% {
    opacity: 0.55;
    transform: scale(1);
  }

  70%,
  100% {
    opacity: 0;
    transform: scale(2.2);
  }
}*/
</style>
