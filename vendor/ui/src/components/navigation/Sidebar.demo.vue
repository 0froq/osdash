<script setup lang="ts">
import type { SidebarGroup } from '../../vue'
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'

const active = ref('installation')
const groups: SidebarGroup[] = [
  {
    label: 'Guide',
    items: [
      { value: 'overview', label: 'Overview' },
      {
        value: 'getting-started',
        label: 'Getting started',
        children: [
          { value: 'installation', label: 'Installation' },
          { value: 'configuration', label: 'Configuration' },
        ],
      },
    ],
  },
  {
    label: 'Reference',
    items: [
      { value: 'tokens', label: 'Tokens' },
      { value: 'accessibility', label: 'Accessibility' },
    ],
  },
]
</script>

<template>
  <Sidebar
    v-model="active"
    :groups="groups"
    foldable
  />
  <p class="demo-readout">
    {{ active }}
  </p>
</template>
