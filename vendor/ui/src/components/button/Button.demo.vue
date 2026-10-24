<script setup lang="ts">
import { ref } from 'vue'
import Button from './Button.vue'

const saved = ref(false)
</script>

<template>
  <p class="demo-sentence">
    <Button @click="saved = true">
      Save
    </Button>
  </p>
  <p class="demo-readout">
    {{ saved ? 'saved' : 'idle' }}
  </p>
</template>
