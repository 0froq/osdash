<script setup lang="ts">
import type { TagItem } from '../../vue'
import Tags from './Tags.vue'

const items: TagItem[] = [
  { value: 'no-pr', label: 'No PR yet' },
  { value: 'later', label: 'Later · 14:32', pending: true },
  { value: 'claimed', label: 'Claimed' },
  { value: 'stalled', label: 'Stalled over 14 days', tone: 'accent' },
  {
    value: 'fixed-by',
    label: 'Fixed by antfu in #310 ↗',
    href: 'https://github.com',
    external: true,
  },
  { value: 'related', label: 'Related #686' },
]
</script>

<template>
  <Tags
    label="Contribution"
    :items="items"
  />
</template>
