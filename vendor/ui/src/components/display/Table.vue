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
  cell?: (scope: { row: T, column: TableColumn<T>, value: T[keyof T], index: number }) => unknown
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
