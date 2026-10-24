<script setup lang="ts">
import { ago, type Story } from '~/demo/story'

defineProps<{ story: Story; nowMs: number }>()
</script>

<template>
  <section class="x-notes">
    <p class="x-notes-head">
      <span>Notes on {{ story.repo }}</span>
      <span class="x-notes-add">+ Note</span>
    </p>
    <ul v-if="story.repoNotes.length">
      <li
        v-for="note in story.repoNotes"
        :key="note.at"
      >
        <span>{{ note.text }}</span>
        <span class="x-ago">{{ ago(note.at, nowMs) }}</span>
      </li>
    </ul>
    <p
      v-else
      class="x-notes-empty"
    >
      Nothing yet. Notes stay in osdash and never go to GitHub.
    </p>
  </section>
</template>
