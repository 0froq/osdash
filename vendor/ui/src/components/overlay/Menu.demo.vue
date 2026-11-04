<script setup lang="ts">
import type { MenuItem } from '../../vue'
import { ref } from 'vue'
import Button from '../button/Button.vue'
import Menu from './Menu.vue'

const items: MenuItem[] = [
  { value: 'rename', label: 'Rename' },
  {
    value: 'export',
    label: 'Export',
    children: [
      { value: 'markdown', label: 'Markdown' },
      { value: 'html', label: 'HTML' },
    ],
  },
  { value: 'share', label: 'Share', disabled: true },
  { value: 'archive', label: 'Archive', separatorBefore: true },
]
const selected = ref('No command selected')
const selectedEnd = ref('No command selected')
</script>

<template>
  <div class="demo-rows">
    <div class="demo-row">
      <div class="demo-sentence">
        <Menu
          label="Document actions"
          :items="items"
          @select="item => (selected = item.label)"
        >
          <template #trigger>
            <Button>Document actions</Button>
          </template>
        </Menu>
      </div>
      <div class="demo-value">
        <code>#trigger slot</code>
        <span>frame stays solid while open · {{ selected }}</span>
      </div>
    </div>
    <div class="demo-row">
      <div class="demo-sentence">
        <Menu
          label="Document actions"
          :items="items"
          align="end"
          @select="item => (selectedEnd = item.label)"
        />
      </div>
      <div class="demo-value">
        <code>label + align=end</code>
        <span>default Button trigger · {{ selectedEnd }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-rows {
  display: grid;
  gap: 20px;
}

.demo-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 20px;
  align-items: start;
}

.demo-sentence {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

.demo-value {
  display: grid;
  gap: 4px;
  justify-items: start;
  padding-top: 3px;
  color: var(--ui-muted);
  font-size: 11px;
}

.demo-value code {
  color: var(--ui-fg);
  font-family: var(--ui-font-meta);
}

.demo-value span {
  font-family: var(--ui-font-meta);
}
</style>
