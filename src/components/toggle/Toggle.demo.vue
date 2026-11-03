<script setup lang="ts">
import { ref } from 'vue'
import Toggle from './Toggle.vue'

const on = ref(false)
const dark = ref(false)
</script>

<template>
  <p class="demo-sentence">
    Read it
    <Toggle
      v-model="on"
      label="sound"
      off-label="quiet"
      on-label="aloud"
    />.
  </p>
  <p class="demo-readout">
    {{ on }}
  </p>
  <p class="demo-sentence">
    <Toggle
      v-model="dark"
      label="Color theme"
    >
      <template #off>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="4"
          />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
        </svg>
      </template>
      <template #on>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
        </svg>
      </template>
    </Toggle>
  </p>
</template>
