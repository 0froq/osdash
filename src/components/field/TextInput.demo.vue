<script setup lang="ts">
import { ref } from 'vue'
import Button from '../button/Button.vue'
import TextInput from './TextInput.vue'

const name = ref('')
const disabled = ref(false)
</script>

<template>
  <TextInput
    v-model="name"
    label="Name"
    name="name"
    autocomplete="name"
    placeholder="Your name"
    :disabled="disabled"
  />
  <Button
    :aria-pressed="disabled"
    @click="disabled = !disabled"
  >
    Toggle disabled
  </Button>
  <p class="demo-readout">
    {{ name || 'empty' }}
  </p>
</template>
