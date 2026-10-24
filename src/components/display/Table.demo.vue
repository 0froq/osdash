<script setup lang="ts">
import type { TableColumn } from '../../vue'
import Badge from './Badge.vue'
import Table from './Table.vue'

interface DocumentRow {
  id: string
  title: string
  status: string
}
const rows: DocumentRow[] = [
  { id: 'one', title: 'Tokens and typography', status: 'Published' },
  { id: 'two', title: 'Composition notes', status: 'Draft' },
]
const columns: TableColumn<DocumentRow>[] = [{ key: 'title', label: 'Document' }, { key: 'status', label: 'Status' }]
</script>

<template>
  <Table
    caption="Recent documents"
    :rows="rows"
    :columns="columns"
    :row-key="row => row.id"
  >
    <template #cell="{ column, value }">
      <Badge v-if="column.key === 'status'">
        {{ value }}
      </Badge>
      <template v-else>
        {{ value }}
      </template>
    </template>
    <template #empty>
      No documents yet.
    </template>
  </Table>
</template>
