<script setup lang="ts">
import { ref } from 'vue'
import Button from '../button/Button.vue'
import Avatar from './Avatar.vue'

const showImage = ref(false)
</script>

<template>
  <div style="display: flex; align-items: center; gap: 16px">
    <Avatar
      label="froq"
      fallback="fq"
      :src="showImage ? '/favicon.svg' : undefined"
      loading="eager"
    />
    <Button @click="showImage = !showImage">
      Toggle image
    </Button>
  </div>
</template>
