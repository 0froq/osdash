<script setup lang="ts" generic="TRow extends object, TColumn extends object">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    label: string
    rows: readonly TRow[]
    rowKey: (row: TRow) => string | number
    columns: readonly TColumn[]
    columnKey: (column: TColumn) => string | number
    current?: string | number
    rowHeight?: string
    columnWidth?: string
    crosshair?: boolean
  }>(),
  {
    rowHeight: '48px',
    columnWidth: '7rem',
    crosshair: true,
  },
)
defineSlots<{
  'header'?: () => unknown
  'row-header'?: (scope: { row: TRow }) => unknown
  'cell'?: (scope: { row: TRow; column: TColumn }) => unknown
}>()

const hoverRow = ref<string | number>()
const hoverColumn = ref<string | number>()

function point(event: PointerEvent, row: string | number, column: string | number) {
  if (event.pointerType !== 'mouse') return
  hoverRow.value = row
  hoverColumn.value = column
}
function clear() {
  hoverRow.value = undefined
  hoverColumn.value = undefined
}
</script>

<template>
  <div
    class="ui-grid-table"
    role="group"
    :aria-label="label"
    :style="{
      'gridTemplateColumns': `max-content repeat(${Math.max(1, columns.length)}, minmax(${columnWidth}, 1fr))`,
      '--ui-grid-table-row-height': rowHeight,
    }"
    @pointerleave="clear"
  >
    <span
      class="ui-grid-table-corner"
      aria-hidden="true"
    />
    <div class="ui-grid-table-header">
      <slot name="header" />
    </div>
    <template
      v-for="row in rows"
      :key="rowKey(row)"
    >
      <div
        class="ui-grid-table-row-header"
        :class="{ 'is-hover': crosshair && rowKey(row) === hoverRow }"
      >
        <slot
          name="row-header"
          :row="row"
        />
      </div>
      <div
        v-for="column in columns"
        :key="columnKey(column)"
        class="ui-grid-table-cell"
        :class="{
          'is-current': columnKey(column) === current,
          'is-hover': crosshair && (rowKey(row) === hoverRow || columnKey(column) === hoverColumn),
        }"
        @pointerenter="point($event, rowKey(row), columnKey(column))"
      >
        <slot
          name="cell"
          :row="row"
          :column="column"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.ui-grid-table {
  --ui-grid-table-row-height: 48px;
  display: grid;
  width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  border-bottom: 1px solid var(--ui-line);
  color: var(--ui-fg);
  font: 12px/1.6 var(--ui-font-meta);
}

.ui-grid-table-header {
  display: contents;
}

.ui-grid-table-header :deep(.ui-choice) {
  display: contents;
}

.ui-grid-table-header :deep(.ui-choice-options) {
  display: grid;
  grid-column: 2 / -1;
  grid-template-columns: subgrid;
  gap: 0;
  align-items: stretch;
  font: inherit;
  line-height: 1.6;
}

.ui-grid-table-header :deep(.ui-choice-mark),
.ui-grid-table-header :deep(.ui-choice-word::after) {
  display: none;
}

.ui-grid-table-header :deep(.ui-choice-word) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 40px;
  padding-inline: 12px;
  border-top: 1px solid var(--ui-line);
  font-size: 12px;
}

.ui-grid-table-header :deep(.ui-choice-word.is-active),
.ui-grid-table-cell.is-current {
  background: color-mix(in oklab, var(--ui-fg) 7%, transparent);
}

.ui-grid-table-cell.is-hover {
  background: color-mix(in oklab, var(--ui-fg) 5%, transparent);
}

.ui-grid-table-cell.is-current.is-hover {
  background: color-mix(in oklab, var(--ui-fg) 10%, transparent);
}

.ui-grid-table-row-header.is-hover {
  --ui-grid-table-pin: color-mix(in oklab, var(--ui-fg) 5%, var(--ui-bg));
}

.ui-grid-table-corner,
.ui-grid-table-row-header {
  position: sticky;
  inset-inline-start: 0;
  z-index: 1;
  min-height: var(--ui-grid-table-row-height);
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--ui-line);
  background: var(--ui-grid-table-pin, var(--ui-bg));
}

.ui-grid-table-row-header {
  display: flex;
  align-items: center;
  padding-inline: 16px;
  color: var(--ui-fg);
}

.ui-grid-table-corner::after,
.ui-grid-table-row-header::after {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline-start: 100%;
  width: 20px;
  background: linear-gradient(to right, var(--ui-grid-table-pin, var(--ui-bg)), transparent);
  pointer-events: none;
}

@supports (animation-timeline: scroll()) {
  .ui-grid-table-corner::after,
  .ui-grid-table-row-header::after {
    opacity: 0;
    animation: ui-grid-table-pin-fade linear both;
    animation-timeline: scroll(nearest inline);
    animation-range: 0 24px;
  }
}

/*At rest the pinned cells are clear so the paper shows through. They fill in as the grid scrolls.*/
@supports (animation-timeline: scroll()) {
  .ui-grid-table-corner,
  .ui-grid-table-row-header {
    background-color: transparent;
    animation: ui-grid-table-pin-fill linear both;
    animation-timeline: scroll(nearest inline);
    animation-range: 0 24px;
  }

  .ui-grid-table-row-header.is-hover {
    background-color: color-mix(in srgb, var(--ui-fg) 5%, transparent);
  }
}

.ui-grid-table-cell {
  display: flex;
  min-height: var(--ui-grid-table-row-height);
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--ui-line);
  color: var(--ui-fg);
}

.ui-grid-table :deep(a:focus-visible),
.ui-grid-table-header :deep(.ui-choice-word:focus-visible) {
  outline: 1px solid var(--ui-accent);
  outline-offset: -2px;
}

@keyframes ui-grid-table-pin-fill {
  to {
    background-color: var(--ui-grid-table-pin, var(--ui-bg));
  }
}

@keyframes ui-grid-table-pin-fade {
  to {
    opacity: 1;
  }
}
</style>
