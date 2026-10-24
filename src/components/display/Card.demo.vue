<script setup lang="ts">
import Button from '../button/Button.vue'
import Badge from './Badge.vue'
import Card from './Card.vue'
</script>

<template>
  <Card>
    <template #header>
      <Badge>Field notes</Badge>
    </template>
    <p>Small observations, collected over time.</p>
    <template #footer>
      <Button>Read notes</Button>
    </template>
  </Card>
</template>
