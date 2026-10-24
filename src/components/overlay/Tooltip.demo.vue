<script setup lang="ts">
import IconButton from '../button/IconButton.vue'
import Tooltip from './Tooltip.vue'
</script>

<template>
  <Tooltip text="Save this draft locally">
    <IconButton label="Save draft">
      ↓
    </IconButton>
  </Tooltip>
</template>
