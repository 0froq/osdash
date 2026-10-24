<script setup lang="ts">
import AspectRatio from './AspectRatio.vue'
</script>

<template>
  <div style="width: min(100%, 20rem)">
    <AspectRatio
      :ratio="16 / 9"
      fit="contain"
    >
      <img
        src="/favicon.svg"
        alt="froq mark"
        loading="lazy"
      >
    </AspectRatio>
  </div>
</template>
