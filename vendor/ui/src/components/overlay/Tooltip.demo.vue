<script setup lang="ts">
import IconControl from '../button/IconControl.vue'
import Tooltip from './Tooltip.vue'
</script>

<template>
  <Tooltip text="Save this draft locally">
    <IconControl label="Save draft">
      ↓
    </IconControl>
  </Tooltip>
</template>
