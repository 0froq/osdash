<script setup lang="ts">
import { ref } from 'vue'
import Button from '../button/Button.vue'
import Collapsible from './Collapsible.vue'

const open = ref(false)
</script>

<template>
  <Collapsible
    v-model="open"
    label="Installation details"
  >
    <p>Content stays mounted when this panel closes.</p>
    <Button @click="open = false">
      Close from inside
    </Button>
  </Collapsible>
</template>
