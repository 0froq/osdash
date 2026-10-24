<script setup lang="ts">
import { ref } from 'vue'
import Pagination from './Pagination.vue'

const page = ref(4)
</script>

<template>
  <div>
    <Pagination
      v-model="page"
      label="Collection pages"
      :pages="12"
      previous-label="Previous"
      next-label="Next"
      :page-label="value => `Page ${value}`"
    />
    <p aria-live="polite">
      Current page: {{ page }}
    </p>
  </div>
</template>
