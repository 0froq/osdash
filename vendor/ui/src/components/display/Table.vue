<script setup lang="ts" generic="T extends object">
import type { TableColumn } from '../../vue'

defineOptions({ inheritAttrs: false })
defineProps<{
  caption: string
  rows: T[]
  columns: TableColumn<T>[]
  rowKey: (row: T) => string | number
}>()
defineSlots<{
  header?: (scope: { column: TableColumn<T> }) => unknown
  cell?: (scope: { row: T; column: TableColumn<T>; value: T[keyof T]; index: number }) => unknown
  empty?: () => unknown
}>()
</script>

<template>
  <div
    class="ui-table-scroll"
    role="region"
    :aria-label="caption"
    tabindex="0"
  >
    <table
      v-bind="$attrs"
      class="ui-table"
    >
      <caption>{{ caption }}</caption>
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            :style="{ textAlign: column.align ?? 'start' }"
          >
            <slot
              name="header"
              :column="column"
            >
              {{ column.label }}
            </slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in rows"
          :key="rowKey(row)"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            :style="{ textAlign: column.align ?? 'start' }"
          >
            <slot
              name="cell"
              :row="row"
              :column="column"
              :value="row[column.key]"
              :index="index"
            >
              {{ row[column.key] }}
            </slot>
          </td>
        </tr>
        <tr v-if="!rows.length && $slots.empty">
          <td :colspan="Math.max(1, columns.length)">
            <slot name="empty" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.ui-table-scroll {
  overflow-x: auto;
}

.ui-table-scroll:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 4px;
}

.ui-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
  font-size: 14px;
  line-height: 1.5;
}

.ui-table :deep(caption) {
  padding-block-end: 12px;
  color: var(--ui-muted);
  text-align: start;
}

.ui-table :deep(th),
.ui-table :deep(td) {
  padding: 10px 16px 10px 0;
  border-bottom: 1px solid var(--ui-line);
}

.ui-table :deep(th) {
  color: var(--ui-muted);
  font-family: var(--ui-font-meta);
  font-size: 11px;
  font-weight: normal;
}
</style>
