<script setup lang="ts">
import { ref } from 'vue'
import Button from '../button/Button.vue'
import Sidebar from '../navigation/Sidebar.vue'
import Skeleton from './Skeleton.vue'

const loading = ref(true)
const groups = [{ label: 'Reference', items: [
  { value: 'overview', label: 'Overview' },
  { value: 'components', label: 'Components' },
  { value: 'tokens', label: 'Tokens' },
] }]
</script>

<template>
  <Skeleton
    :loading="loading"
    width="12rem"
  >
    <Sidebar
      :groups="groups"
      model-value="components"
      aria-label="Skeleton example navigation"
    />
  </Skeleton>
  <p class="demo-readout">
    <Button @click="loading = !loading">
      {{ loading ? 'Reveal component' : 'Show skeleton' }}
    </Button>
  </p>
</template>
