<script setup lang="ts">
import { storyText, type Story } from '~/demo/story'
import { dayLabel } from '~/utils/time'

defineProps<{ story: Story }>()
</script>

<template>
  <pre class="x-cli">{{ storyText(story, dayLabel) }}</pre>
</template>
