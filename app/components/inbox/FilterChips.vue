<script setup lang="ts">
defineProps<{
  repos: Array<{ name: string; count: number }>
  active: string
}>()

const emit = defineEmits<{ select: [repo: string] }>()
</script>

<template>
  <div
    v-if="repos.length > 1"
    class="repo-row"
  >
    <button
      v-for="repo in repos"
      :key="repo.name"
      class="nav-chip"
      :class="{ current: repo.name === active }"
      type="button"
      @click="emit('select', repo.name === active ? '' : repo.name)"
    >
      {{ repo.name }}
      <span class="chip-count">{{ repo.count }}</span>
    </button>
  </div>
</template>
