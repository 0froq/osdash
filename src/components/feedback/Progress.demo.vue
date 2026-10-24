<script setup lang="ts">
import { ref } from 'vue'
import Button from '../button/Button.vue'
import Progress from './Progress.vue'

const value = ref(35)
</script>

<template>
  <div style="display: grid; gap: 16px; width: 100%">
    <Progress
      label="Upload progress"
      :value="value"
    />
    <span>{{ value }}%</span>
    <Button @click="value = (value + 25) % 101">
      Advance
    </Button>
    <Progress label="Preparing upload" />
  </div>
</template>
