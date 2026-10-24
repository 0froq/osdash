<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import Button from '../button/Button.vue'
import Checkbox from '../checkbox/Checkbox.vue'
import Collapsible from '../disclosure/Collapsible.vue'
import ContextMenu from './ContextMenu.vue'

const disabled = ref(false)
const menu = useTemplateRef<{ close: () => void }>('menu')
</script>

<template>
  <Checkbox
    v-model="disabled"
    label="Disable context menu"
  />
  <Button @click="menu?.close()">
    Close context menu
  </Button>
  <ContextMenu
    ref="menu"
    label="Draft actions"
    :disabled="disabled"
    :items="[
      { value: 'rename', label: 'Rename' },
      { value: 'export', label: 'Export', children: [{ value: 'markdown', label: 'Markdown' }] },
      { value: 'archive', label: 'Archive', separatorBefore: true },
    ]"
  >
    <p>Right-click this draft, or focus this area and press Shift+F10.</p>
    <Collapsible label="Draft details">
      <p>Open this panel, then toggle the menu's disabled state. Its local state stays intact.</p>
    </Collapsible>
  </ContextMenu>
</template>
