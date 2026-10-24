<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import Button from '../button/Button.vue'
import FileUpload from './FileUpload.vue'

const files = shallowRef<File[]>([])
const resetKey = ref(0)
</script>

<template>
  <FileUpload
    label="Attach images"
    name="images"
    accept="image/*"
    multiple
    :reset-key="resetKey"
    @change="files = $event"
  />
  <p class="demo-readout">
    {{ files.length ? files.map(file => file.name).join(', ') : 'No files selected' }}
  </p>
  <Button @click="resetKey++">
    Clear selection
  </Button>
</template>
