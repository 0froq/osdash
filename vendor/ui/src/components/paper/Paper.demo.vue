<script setup lang="ts">
import { layoutText as layoutHandwriting } from '../../core/signature/hand-font'
import Paper from './Paper.vue'

const lettering = layoutHandwriting('Held on the sheet', { size: 40 })
const paths = lettering.strokes.map(stroke => stroke.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' '))
</script>

<template>
  <Paper style="min-height: 180px">
    <p class="demo-sentence">
      Held on the sheet.
    </p>
    <svg
      :viewBox="`0 ${-lettering.ascent} ${lettering.width} ${lettering.ascent + lettering.descent}`"
      style="width: min(100%, 24rem); overflow: visible"
      role="img"
      aria-label="Held on the sheet, in handwriting"
    >
      <path
        v-for="(path, index) in paths"
        :key="index"
        :d="path"
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </Paper>
</template>
