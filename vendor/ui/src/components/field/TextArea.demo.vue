<script setup lang="ts">
import { ref } from 'vue'
import TextArea from './TextArea.vue'

const note = ref('')
</script>

<template>
  <TextArea
    v-model="note"
    label="Note"
  />
  <p class="demo-readout">
    {{ note || 'empty' }}
  </p>
</template>
