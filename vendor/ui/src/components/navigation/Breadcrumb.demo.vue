<script setup lang="ts">
import Breadcrumb from './Breadcrumb.vue'
</script>

<template>
  <Breadcrumb
    label="Breadcrumb"
    :items="[
      { value: 'components', label: 'Components', href: '/components' },
      { value: 'navigation', label: 'Navigation', href: '/components/navigation' },
      { value: 'breadcrumb', label: 'Breadcrumb' },
    ]"
  />
</template>
