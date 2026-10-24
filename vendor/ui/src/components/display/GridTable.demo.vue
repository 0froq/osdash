<script setup lang="ts">
import type { ChoiceOption } from '../../vue'
import { ref } from 'vue'
import Choice from '../radio/Choice.vue'
import GridTable from './GridTable.vue'

interface PortRow {
  id: string
  title: string
}
interface VariantColumn {
  id: string
  label: string
}

const rows: PortRow[] = [
  { id: 'vim', title: 'Vim' },
  { id: 'nvim', title: 'Neovim' },
]
const columns: VariantColumn[] = [
  { id: 'full', label: 'Full' },
  { id: 'lite', label: 'Lite' },
  { id: 'min', label: 'Minimal' },
]
const options: ChoiceOption<string>[] = columns.map(column => ({ value: column.id, label: column.label }))
const variant = ref('full')
</script>

<template>
  <GridTable
    label="Ports by variant"
    :rows="rows"
    :row-key="row => row.id"
    :columns="columns"
    :column-key="column => column.id"
    :current="variant"
  >
    <template #header>
      <Choice
        v-model="variant"
        :options="options"
      />
    </template>
    <template #row-header="{ row }">
      {{ row.title }}
    </template>
    <template #cell="{ row, column }">
      <a
        :href="`#${row.id}-${column.id}`"
        :title="`${row.title} ${column.label}`"
      >
        Download
      </a>
    </template>
  </GridTable>
</template>
