<script setup lang="ts">
import { ref } from 'vue'
import NumberInput from './NumberInput.vue'

const quantity = ref<number | undefined>(2)
</script>

<template>
  <NumberInput
    v-model="quantity"
    label="Quantity"
    name="quantity"
    :min="1"
    :max="20"
    :step="1"
    required
  />
  <p class="demo-readout">
    {{ quantity === undefined ? 'empty' : quantity }}
  </p>
</template>
